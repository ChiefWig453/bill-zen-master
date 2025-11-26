import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all maintenance tasks for user
router.get('/tasks', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { frequency } = req.query;
    
    let sql = 'SELECT * FROM maintenance_tasks WHERE user_id = $1';
    const params: any[] = [req.userId];
    
    if (frequency) {
      sql += ' AND frequency = $2';
      params.push(frequency);
    }
    
    sql += ' ORDER BY next_due_date ASC NULLS LAST';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching maintenance tasks:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance tasks' });
  }
});

// Create maintenance task
router.post('/tasks', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, description, frequency, season, reminder_days_before, is_custom, next_due_date } = req.body;
    
    const result = await query(
      `INSERT INTO maintenance_tasks (user_id, name, description, frequency, season, reminder_days_before, is_custom, next_due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.userId, name, description, frequency, season, reminder_days_before || 3, is_custom || false, next_due_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating maintenance task:', error);
    res.status(500).json({ error: 'Failed to create maintenance task' });
  }
});

// Update maintenance task
router.patch('/tasks/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE maintenance_tasks SET ${setClause}, updated_at = NOW()
       WHERE id = $1 AND user_id = $${fields.length + 2}
       RETURNING *`,
      [id, ...values, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating maintenance task:', error);
    res.status(500).json({ error: 'Failed to update maintenance task' });
  }
});

// Delete maintenance task
router.delete('/tasks/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM maintenance_tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance task not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting maintenance task:', error);
    res.status(500).json({ error: 'Failed to delete maintenance task' });
  }
});

// Get maintenance history for user
router.get('/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { task_id } = req.query;
    
    let sql = 'SELECT * FROM maintenance_history WHERE user_id = $1';
    const params: any[] = [req.userId];
    
    if (task_id) {
      sql += ' AND task_id = $2';
      params.push(task_id);
    }
    
    sql += ' ORDER BY completed_at DESC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching maintenance history:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance history' });
  }
});

// Create maintenance history record
router.post('/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { task_id, completed_at, notes } = req.body;
    
    const result = await query(
      `INSERT INTO maintenance_history (user_id, task_id, completed_at, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.userId, task_id, completed_at || new Date().toISOString(), notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating maintenance history:', error);
    res.status(500).json({ error: 'Failed to create maintenance history' });
  }
});

export default router;
