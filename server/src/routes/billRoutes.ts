import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all bills for user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM bills WHERE user_id = $1 ORDER BY due_date ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Create bill
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, amount, due_date, category, is_paid, is_archived } = req.body;
    
    const result = await query(
      `INSERT INTO bills (user_id, name, amount, due_date, category, is_paid, is_archived)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.userId, name, amount, due_date, category, is_paid || false, is_archived || false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

// Update bill
router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE bills SET ${setClause}, updated_at = NOW()
       WHERE id = $1 AND user_id = $${fields.length + 2}
       RETURNING *`,
      [id, ...values, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ error: 'Failed to update bill' });
  }
});

// Delete bill
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM bills WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

// Get recurring bill templates
router.get('/templates', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM bill_templates WHERE user_id = $1 ORDER BY name ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bill templates:', error);
    res.status(500).json({ error: 'Failed to fetch bill templates' });
  }
});

// Create recurring bill template
router.post('/templates', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, amount, category, due_day } = req.body;
    
    const result = await query(
      `INSERT INTO bill_templates (user_id, name, amount, category, due_day)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.userId, name, amount, category, due_day]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating bill template:', error);
    res.status(500).json({ error: 'Failed to create bill template' });
  }
});

// Update recurring bill template
router.patch('/templates/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE bill_templates SET ${setClause}, updated_at = NOW()
       WHERE id = $1 AND user_id = $${fields.length + 2}
       RETURNING *`,
      [id, ...values, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill template not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating bill template:', error);
    res.status(500).json({ error: 'Failed to update bill template' });
  }
});

// Delete recurring bill template
router.delete('/templates/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM bill_templates WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill template not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bill template:', error);
    res.status(500).json({ error: 'Failed to delete bill template' });
  }
});

export default router;
