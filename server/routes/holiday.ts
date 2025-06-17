
import express from 'express';
import { executeQuery } from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all holidays
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const holidays = await executeQuery(
      'SELECT * FROM company_holidays WHERE YEAR(date) = ? ORDER BY date',
      [year]
    );

    res.json({ success: true, holidays });
  } catch (error) {
    console.error('Get holidays error:', error);
    res.status(500).json({ success: false, message: 'Failed to get holidays' });
  }
});

// Add new holiday (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { name, date, type, description, office_status, is_recurring } = req.body;

    const result = await executeQuery(
      `INSERT INTO company_holidays (name, date, type, description, office_status, is_recurring, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, date, type, description, office_status, is_recurring, req.user!.id]
    );

    res.status(201).json({
      success: true,
      message: 'Holiday added successfully',
      holidayId: result.insertId
    });
  } catch (error) {
    console.error('Add holiday error:', error);
    res.status(500).json({ success: false, message: 'Failed to add holiday' });
  }
});

// Update holiday (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, date, type, description, office_status, is_recurring } = req.body;

    await executeQuery(
      `UPDATE company_holidays 
       SET name = ?, date = ?, type = ?, description = ?, office_status = ?, is_recurring = ?
       WHERE id = ?`,
      [name, date, type, description, office_status, is_recurring, id]
    );

    res.json({
      success: true,
      message: 'Holiday updated successfully'
    });
  } catch (error) {
    console.error('Update holiday error:', error);
    res.status(500).json({ success: false, message: 'Failed to update holiday' });
  }
});

// Delete holiday (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await executeQuery('DELETE FROM company_holidays WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Holiday deleted successfully'
    });
  } catch (error) {
    console.error('Delete holiday error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete holiday' });
  }
});

export default router;
