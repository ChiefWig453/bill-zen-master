import { Router, Request, Response } from 'express';
import { authService, signupSchema, loginSchema } from '../services/authService';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { z } from 'zod';

const router = Router();

// Signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = signupSchema.parse(req.body);
    
    const user = await authService.signup(email, password, firstName, lastName);
    
    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    
    if (error instanceof Error) {
      if (error.message === 'User already exists') {
        return res.status(409).json({ error: error.message });
      }
    }
    
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const result = await authService.login(email, password);
    
    res.json({
      message: 'Login successful',
      ...result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    
    if (error instanceof Error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: error.message });
      }
    }
    
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    
    const result = await authService.refreshAccessToken(refreshToken);
    
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return res.status(401).json({ error: error.message });
      }
    }
    
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    
    await authService.logout(refreshToken);
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, created_at, updated_at, invited_at, invited_by FROM profiles WHERE id = $1',
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Get user role
router.get('/role', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ role: null });
    }
    
    res.json({ role: result.rows[0].role });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Failed to get role' });
  }
});

export default router;
