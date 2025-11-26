import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get user preferences
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      // Create default preferences if none exist
      const newPrefs = await query(
        `INSERT INTO user_preferences (user_id, bills_enabled, doordash_enabled, home_maintenance_enabled)
         VALUES ($1, true, false, false)
         RETURNING *`,
        [req.userId]
      );
      return res.json(newPrefs.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update user preferences
router.patch('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const result = await query(
      `UPDATE user_preferences SET ${setClause}, updated_at = NOW()
       WHERE user_id = $${fields.length + 1}
       RETURNING *`,
      [...values, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preferences not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
