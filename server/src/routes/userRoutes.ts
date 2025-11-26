import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

// Check if user is admin
const isAdmin = async (userId: string): Promise<boolean> => {
  const result = await query(
    'SELECT role FROM user_roles WHERE user_id = $1 AND role = $2',
    [userId, 'admin']
  );
  return result.rows.length > 0;
};

// Get all users (admin only)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!await isAdmin(req.userId!)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const result = await query(`
      SELECT 
        u.id,
        u.email,
        u.created_at,
        p.first_name,
        p.last_name,
        p.invited_at,
        p.invited_by,
        ur.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      ORDER BY u.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Invite user (admin only)
router.post('/invite', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!await isAdmin(req.userId!)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await query(
      'INSERT INTO users (email) VALUES ($1) RETURNING id',
      [email]
    );
    const newUserId = userResult.rows[0].id;

    // Create user password
    await query(
      'INSERT INTO user_passwords (user_id, password_hash) VALUES ($1, $2)',
      [newUserId, passwordHash]
    );

    // Create profile
    await query(
      `INSERT INTO profiles (id, email, first_name, last_name, invited_by, invited_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [newUserId, email, firstName || null, lastName || null, req.userId]
    );

    // Create user role
    await query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [newUserId, role || 'user']
    );

    // Create user preferences
    await query(
      'INSERT INTO user_preferences (user_id) VALUES ($1)',
      [newUserId]
    );

    res.status(201).json({ 
      id: newUserId,
      email,
      message: 'User invited successfully' 
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
});

// Update user (admin only)
router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!await isAdmin(req.userId!)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const { email, firstName, lastName, role } = req.body;

    // Update email if changed
    if (email) {
      await query(
        'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2',
        [email, id]
      );
      await query(
        'UPDATE profiles SET email = $1, updated_at = NOW() WHERE id = $2',
        [email, id]
      );
    }

    // Update profile if name changed
    if (firstName !== undefined || lastName !== undefined) {
      await query(
        'UPDATE profiles SET first_name = $1, last_name = $2, updated_at = NOW() WHERE id = $3',
        [firstName || null, lastName || null, id]
      );
    }

    // Update role if changed
    if (role) {
      await query(
        'UPDATE user_roles SET role = $1 WHERE user_id = $2',
        [role, id]
      );
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!await isAdmin(req.userId!)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete user (cascading deletes will handle related records)
    await query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
