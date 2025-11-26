import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all dash sessions for user
router.get('/sessions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM dash_sessions WHERE user_id = $1 ORDER BY start_time DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching dash sessions:', error);
    res.status(500).json({ error: 'Failed to fetch dash sessions' });
  }
});

// Create dash session
router.post('/sessions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { start_time, end_time, base_pay, tips_app, tips_cash, promotions, total_earnings, total_deliveries, miles_driven, gas_cost, notes } = req.body;
    
    const result = await query(
      `INSERT INTO dash_sessions (user_id, start_time, end_time, base_pay, tips_app, tips_cash, promotions, total_earnings, total_deliveries, miles_driven, gas_cost, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [req.userId, start_time, end_time, base_pay || 0, tips_app || 0, tips_cash || 0, promotions || 0, total_earnings || 0, total_deliveries || 0, miles_driven, gas_cost, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating dash session:', error);
    res.status(500).json({ error: 'Failed to create dash session' });
  }
});

// Update dash session
router.patch('/sessions/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE dash_sessions SET ${setClause}, updated_at = NOW()
       WHERE id = $1 AND user_id = $${fields.length + 2}
       RETURNING *`,
      [id, ...values, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dash session not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating dash session:', error);
    res.status(500).json({ error: 'Failed to update dash session' });
  }
});

// Delete dash session
router.delete('/sessions/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM dash_sessions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dash session not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting dash session:', error);
    res.status(500).json({ error: 'Failed to delete dash session' });
  }
});

// Get all dash expenses for user
router.get('/expenses', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM dash_expenses WHERE user_id = $1 ORDER BY date DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching dash expenses:', error);
    res.status(500).json({ error: 'Failed to fetch dash expenses' });
  }
});

// Create dash expense
router.post('/expenses', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { date, amount, category, description, receipt_url } = req.body;
    
    const result = await query(
      `INSERT INTO dash_expenses (user_id, date, amount, category, description, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.userId, date, amount, category, description, receipt_url]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating dash expense:', error);
    res.status(500).json({ error: 'Failed to create dash expense' });
  }
});

// Update dash expense
router.patch('/expenses/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE dash_expenses SET ${setClause}, updated_at = NOW()
       WHERE id = $1 AND user_id = $${fields.length + 2}
       RETURNING *`,
      [id, ...values, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dash expense not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating dash expense:', error);
    res.status(500).json({ error: 'Failed to update dash expense' });
  }
});

// Delete dash expense
router.delete('/expenses/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM dash_expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dash expense not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting dash expense:', error);
    res.status(500).json({ error: 'Failed to delete dash expense' });
  }
});

export default router;
