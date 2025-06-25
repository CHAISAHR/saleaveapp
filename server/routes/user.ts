import express from 'express';
import { executeQuery } from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const users = await executeQuery(
      'SELECT id, email, name, department, role, hire_date, is_active, manager_email FROM users ORDER BY name'
    );

    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get users' });
  }
});

// Update user information (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, role, manager_email, hire_date } = req.body;

    // Validate required fields
    if (!name || !email || !department || !hire_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, department, and hire date are required' 
      });
    }

    // Check if email is already taken by another user
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already taken by another user' 
      });
    }

    // Update user information
    await executeQuery(
      `UPDATE users SET 
         name = ?, 
         email = ?, 
         department = ?, 
         role = ?, 
         manager_email = ?, 
         hire_date = ?,
         updated_at = NOW() 
       WHERE id = ?`,
      [name, email, department, role, manager_email || null, hire_date, id]
    );

    // Also update leave_balances table to keep it in sync
    await executeQuery(
      `UPDATE leave_balances SET 
         EmployeeName = ?, 
         EmployeeEmail = ?, 
         Department = ? 
       WHERE EmployeeEmail = (SELECT email FROM users WHERE id = ?)`,
      [name, email, department, id]
    );

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Update user role (admin only)
router.put('/:id/role', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    await executeQuery(
      'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
      [role, id]
    );

    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
});

// Update user manager (admin only)
router.put('/:id/manager', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { manager_email } = req.body;

    await executeQuery(
      'UPDATE users SET manager_email = ?, updated_at = NOW() WHERE id = ?',
      [manager_email, id]
    );

    res.json({ success: true, message: 'User manager updated successfully' });
  } catch (error) {
    console.error('Update manager error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user manager' });
  }
});

export default router;
