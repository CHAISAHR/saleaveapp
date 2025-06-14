
import express from 'express';
import { executeQuery } from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get employee balance
router.get('/:email', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { email } = req.params;
    const year = req.query.year || new Date().getFullYear();

    // Check if user has permission to view this balance
    if (req.user!.role === 'employee' && req.user!.email !== email) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const balances = await executeQuery(
      'SELECT * FROM leave_balances WHERE EmployeeEmail = ? AND Year = ?',
      [email, year]
    );

    if (balances.length === 0) {
      return res.status(404).json({ success: false, message: 'Balance not found' });
    }

    res.json({ success: true, balance: balances[0] });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ success: false, message: 'Failed to get balance' });
  }
});

// Update balance when leave is approved/cancelled
router.put('/update', authenticateToken, requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { employeeEmail, leaveType, daysUsed, action, year } = req.body;
    const currentYear = year || new Date().getFullYear();

    let updateQuery = '';
    let params: any[] = [];

    switch (leaveType.toLowerCase()) {
      case 'annual':
        if (action === 'approve') {
          updateQuery = 'UPDATE leave_balances SET AnnualUsed = AnnualUsed + ? WHERE EmployeeEmail = ? AND Year = ?';
        } else if (action === 'cancel') {
          updateQuery = 'UPDATE leave_balances SET AnnualUsed = AnnualUsed - ? WHERE EmployeeEmail = ? AND Year = ?';
        }
        break;
      case 'sick':
        if (action === 'approve') {
          updateQuery = 'UPDATE leave_balances SET SickUsed = SickUsed + ? WHERE EmployeeEmail = ? AND Year = ?';
        } else if (action === 'cancel') {
          updateQuery = 'UPDATE leave_balances SET SickUsed = SickUsed - ? WHERE EmployeeEmail = ? AND Year = ?';
        }
        break;
      case 'family':
        if (action === 'approve') {
          updateQuery = 'UPDATE leave_balances SET FamilyUsed = FamilyUsed + ? WHERE EmployeeEmail = ? AND Year = ?';
        } else if (action === 'cancel') {
          updateQuery = 'UPDATE leave_balances SET FamilyUsed = FamilyUsed - ? WHERE EmployeeEmail = ? AND Year = ?';
        }
        break;
      // Add other leave types as needed
    }

    if (updateQuery) {
      params = [daysUsed, employeeEmail, currentYear];
      await executeQuery(updateQuery, params);
    }

    res.json({ success: true, message: 'Balance updated successfully' });
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({ success: false, message: 'Failed to update balance' });
  }
});

// Get all balances (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const balances = await executeQuery(
      'SELECT * FROM leave_balances WHERE Year = ? ORDER BY EmployeeName',
      [year]
    );

    res.json({ success: true, balances });
  } catch (error) {
    console.error('Get all balances error:', error);
    res.status(500).json({ success: false, message: 'Failed to get balances' });
  }
});

export default router;
