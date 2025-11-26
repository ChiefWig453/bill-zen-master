import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

// Request password reset
router.post('/reset-request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      // Don't reveal if user exists or not
      return res.json({ message: 'If a user with that email exists, a password reset link has been sent' });
    }

    const userId = userResult.rows[0].id;

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, resetToken, expiresAt]
    );

    // In production, send email with reset link here
    // For now, just return success
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ 
      message: 'If a user with that email exists, a password reset link has been sent',
      // TODO: Remove token from response in production
      resetToken 
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset password with token
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Validate token
    const tokenResult = await query(
      `SELECT user_id, expires_at, used_at 
       FROM password_reset_tokens 
       WHERE token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const tokenData = tokenResult.rows[0];

    // Check if token is expired
    if (new Date() > new Date(tokenData.expires_at)) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Check if token was already used
    if (tokenData.used_at) {
      return res.status(400).json({ error: 'Reset token has already been used' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      `UPDATE user_passwords 
       SET password_hash = $1, updated_at = NOW() 
       WHERE user_id = $2`,
      [passwordHash, tokenData.user_id]
    );

    // Mark token as used
    await query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1',
      [token]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Update password (authenticated user)
router.post('/update', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Get current password hash
    const result = await query(
      'SELECT password_hash FROM user_passwords WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      `UPDATE user_passwords 
       SET password_hash = $1, updated_at = NOW() 
       WHERE user_id = $2`,
      [newPasswordHash, req.userId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
