import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { query } from '../config/database';
import { z } from 'zod';

// Validate JWT_SECRET exists at runtime
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET: string = process.env.JWT_SECRET;
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export const signupSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const authService = {
  async signup(email: string, password: string, firstName?: string, lastName?: string) {
    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM profiles WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and profile in transaction
    const client = await (await import('../config/database')).getClient();
    
    try {
      await client.query('BEGIN');

      // Insert into profiles
      const profileResult = await client.query(
        `INSERT INTO profiles (id, email, first_name, last_name)
         VALUES (gen_random_uuid(), $1, $2, $3)
         RETURNING id, email, first_name, last_name, created_at`,
        [email, firstName || null, lastName || null]
      );

      const profile = profileResult.rows[0];

      // Insert password
      await client.query(
        'INSERT INTO user_passwords (user_id, password_hash) VALUES ($1, $2)',
        [profile.id, hashedPassword]
      );

      // Assign default 'user' role
      await client.query(
        `INSERT INTO user_roles (user_id, role) VALUES ($1, 'user')`,
        [profile.id]
      );

      // Create default preferences
      await client.query(
        `INSERT INTO user_preferences (user_id, bills_enabled, doordash_enabled, home_maintenance_enabled)
         VALUES ($1, true, false, false)`,
        [profile.id]
      );

      await client.query('COMMIT');

      return {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async login(email: string, password: string) {
    // Get user with password and role
    const result = await query(
      `SELECT p.id, p.email, p.first_name, p.last_name, 
              up.password_hash, ur.role
       FROM profiles p
       JOIN user_passwords up ON p.id = up.user_id
       JOIN user_roles ur ON p.id = ur.user_id
       WHERE p.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '${JWT_REFRESH_EXPIRY}')`,
      [user.id, refreshToken]
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      accessToken,
      refreshToken
    };
  },

  async refreshAccessToken(refreshToken: string) {
    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }

    // Check if token exists and is not revoked
    const result = await query(
      `SELECT rt.user_id, ur.role
       FROM refresh_tokens rt
       JOIN user_roles ur ON rt.user_id = ur.user_id
       WHERE rt.token = $1 
       AND rt.expires_at > NOW() 
       AND rt.revoked_at IS NULL`,
      [refreshToken]
    );

    if (result.rows.length === 0) {
      throw new Error('Refresh token not found or expired');
    }

    const { user_id, role } = result.rows[0];

    // Generate new access token
    const accessToken = this.generateAccessToken(user_id, role);

    return { accessToken };
  },

  async logout(refreshToken: string) {
    // Revoke refresh token
    await query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1',
      [refreshToken]
    );
  },

  generateAccessToken(userId: string, role: 'admin' | 'user'): string {
    return jwt.sign(
      { userId, role },
      JWT_SECRET as Secret,
      { expiresIn: JWT_ACCESS_EXPIRY } as SignOptions
    );
  },

  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      JWT_SECRET as Secret,
      { expiresIn: JWT_REFRESH_EXPIRY } as SignOptions
    );
  }
};
