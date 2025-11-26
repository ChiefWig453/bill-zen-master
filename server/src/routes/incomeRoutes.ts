import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all incomes for user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM incomes WHERE user_id = $1 ORDER BY next_date ASC, date_received ASC',
      [req.userId]
    );
    
    // Convert numeric strings to numbers
    const incomes = result.rows.map(income => ({
      ...income,
      amount: Number(income.amount)
    }));
    
    res.json(incomes);
  } catch (error) {
    console.error('Error fetching incomes:', error);
    res.status(500).json({ error: 'Failed to fetch incomes' });
  }
});

// Create income
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, amount, category, frequency, is_recurring, next_date, is_received, date_received } = req.body;
    
    const result = await query(
      `INSERT INTO incomes (user_id, name, amount, category, frequency, is_recurring, next_date, is_received, date_received)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.userId, name, amount, category, frequency, is_recurring || false, next_date, is_received || false, date_received]
    );
    
    const income = {
      ...result.rows[0],
      amount: Number(result.rows[0].amount)
    };
    
    res.status(201).json(income);
  } catch (error) {
    console.error('Error creating income:', error);
    res.status(500).json({ error: 'Failed to create income' });
  }
});

// Update income
router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE incomes SET ${setClause}, updated_at = NOW()
       WHERE id = $1 AND user_id = $${fields.length + 2}
       RETURNING *`,
      [id, ...values, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Income not found' });
    }
    
    const income = {
      ...result.rows[0],
      amount: Number(result.rows[0].amount)
    };
    
    res.json(income);
  } catch (error) {
    console.error('Error updating income:', error);
    res.status(500).json({ error: 'Failed to update income' });
  }
});

// Delete income
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM incomes WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Income not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

export default router;
