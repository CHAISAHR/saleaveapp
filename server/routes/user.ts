
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

