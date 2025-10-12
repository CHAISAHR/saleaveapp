
import express from 'express';
import { executeQuery } from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all holidays
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const year = req.query.year;
    console.log('Fetching holidays, year filter:', year || 'all years');
    
    let query = 'SELECT * FROM company_holidays';
    let params: any[] = [];
    
    if (year) {
      query += ' WHERE YEAR(date) = ?';
      params.push(year);
    }
    
    query += ' ORDER BY date';
    
    const holidays = await executeQuery(query, params);

    console.log('Found holidays:', holidays.length);
    res.json({ success: true, holidays });
  } catch (error) {
    console.error('Get holidays error:', error);
    res.status(500).json({ success: false, message: 'Failed to get holidays' });
  }
});

// Add new holiday (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    console.log('Holiday creation request received');
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    
    const { name, date, type, description, office_status, is_recurring } = req.body;

    // Validate required fields
    if (!name || !date) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Name and date are required fields' 
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      console.log('Validation failed: Invalid date format');
      return res.status(400).json({ 
        success: false, 
        message: 'Date must be in YYYY-MM-DD format' 
      });
    }

    console.log('Inserting holiday into database...');
    const result = await executeQuery(
      `INSERT INTO company_holidays (name, date, type, description, office_status, is_recurring, created_by_email) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, date, type || 'public', description || '', office_status || 'closed', is_recurring || false, req.user!.email]
    );

    console.log('Holiday inserted successfully, ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Holiday added successfully',
      holidayId: result.insertId
    });
  } catch (error: any) {
    console.error('Add holiday error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState
    });

    // Check for specific database errors
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      res.status(500).json({ 
        success: false, 
        message: 'Database table not found. Please ensure the database is properly initialized.' 
      });
    } else if (error?.code === 'ER_BAD_FIELD_ERROR') {
      res.status(500).json({ 
        success: false, 
        message: 'Database column error. Please check the database schema.' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to add holiday' 
      });
    }
  }
});

// Update holiday (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, date, type, description, office_status, is_recurring } = req.body;

    console.log('Updating holiday:', id);

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

    console.log('Deleting holiday:', id);

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
