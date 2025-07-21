
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

    const balance = balances[0];
    
    // Transform the balance data to include proper units and structure for frontend
    const transformedBalances = [
      {
        type: 'Annual',
        used: balance.AnnualUsed,
        total: balance.Broughtforward + balance.AccumulatedLeave,
        accrued: balance.AccumulatedLeave,
        unit: 'days',
        broughtForward: balance.Broughtforward,
        balance: balance.Current_leave_balance
      },
      {
        type: 'Sick',
        used: balance.SickUsed,
        total: balance.Sick,
        accrued: balance.Sick,
        unit: 'days',
        balance: balance.Sick - balance.SickUsed
      },
      {
        type: 'Maternity',
        used: balance.MaternityUsed,
        total: balance.Maternity,
        accrued: balance.Maternity,
        unit: 'months',
        balance: balance.Maternity - balance.MaternityUsed
      },
      {
        type: 'Parental',
        used: balance.ParentalUsed,
        total: balance.Parental,
        accrued: balance.Parental,
        unit: 'weeks',
        balance: balance.Parental - balance.ParentalUsed
      },
      {
        type: 'Adoption',
        used: balance.AdoptionUsed || 0,
        total: balance.Adoption || 4,
        accrued: balance.Adoption || 4,
        unit: 'weeks',
        balance: (balance.Adoption || 4) - (balance.AdoptionUsed || 0)
      },
      {
        type: 'Family',
        used: balance.FamilyUsed,
        total: balance.Family,
        accrued: balance.Family,
        unit: 'days',
        balance: balance.Family - balance.FamilyUsed
      },
      {
        type: 'Study',
        used: balance.StudyUsed || 0,
        total: balance.Study || 6,
        accrued: balance.Study || 6,
        unit: 'days',
        balance: (balance.Study || 6) - (balance.StudyUsed || 0)
      },
      {
        type: 'Wellness',
        used: balance.WellnessUsed || 0,
        total: balance.Wellness || 2,
        accrued: balance.Wellness || 2,
        unit: 'days',
        balance: (balance.Wellness || 2) - (balance.WellnessUsed || 0)
      }
    ];

    res.json({ success: true, balance: balance, balances: transformedBalances });
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
      case 'maternity':
        if (action === 'approve') {
          updateQuery = 'UPDATE leave_balances SET MaternityUsed = MaternityUsed + ? WHERE EmployeeEmail = ? AND Year = ?';
        } else if (action === 'cancel') {
          updateQuery = 'UPDATE leave_balances SET MaternityUsed = MaternityUsed - ? WHERE EmployeeEmail = ? AND Year = ?';
        }
        break;
      case 'parental':
        if (action === 'approve') {
          updateQuery = 'UPDATE leave_balances SET ParentalUsed = ParentalUsed + ? WHERE EmployeeEmail = ? AND Year = ?';
        } else if (action === 'cancel') {
          updateQuery = 'UPDATE leave_balances SET ParentalUsed = ParentalUsed - ? WHERE EmployeeEmail = ? AND Year = ?';
        }
        break;
      case 'adoption':
        if (action === 'approve') {
          updateQuery = 'UPDATE leave_balances SET AdoptionUsed = AdoptionUsed + ? WHERE EmployeeEmail = ? AND Year = ?';
        } else if (action === 'cancel') {
          updateQuery = 'UPDATE leave_balances SET AdoptionUsed = AdoptionUsed - ? WHERE EmployeeEmail = ? AND Year = ?';
        }
        break;
      case 'family':
        if (action === 'approve') {
          updateQuery = 'UPDATE leave_balances SET FamilyUsed = FamilyUsed + ? WHERE EmployeeEmail = ? AND Year = ?';
        } else if (action === 'cancel') {
          updateQuery = 'UPDATE leave_balances SET FamilyUsed = FamilyUsed - ? WHERE EmployeeEmail = ? AND Year = ?';
        }
        break;
      case 'study':
        if (action === 'approve') {
          updateQuery = 'UPDATE leave_balances SET StudyUsed = StudyUsed + ? WHERE EmployeeEmail = ? AND Year = ?';
        } else if (action === 'cancel') {
          updateQuery = 'UPDATE leave_balances SET StudyUsed = StudyUsed - ? WHERE EmployeeEmail = ? AND Year = ?';
        }
        break;
      case 'wellness':
        if (action === 'approve') {
          updateQuery = 'UPDATE leave_balances SET WellnessUsed = WellnessUsed + ? WHERE EmployeeEmail = ? AND Year = ?';
        } else if (action === 'cancel') {
          updateQuery = 'UPDATE leave_balances SET WellnessUsed = WellnessUsed - ? WHERE EmployeeEmail = ? AND Year = ?';
        }
        break;
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

// Update accumulated leave in database
router.put('/accumulated-leave', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { employeeEmail, accumulatedLeave, year } = req.body;
    const currentYear = year || new Date().getFullYear();

    // Check if user has permission to update this balance
    if (req.user!.role === 'employee' && req.user!.email !== employeeEmail) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await executeQuery(
      'UPDATE leave_balances SET AccumulatedLeave = ? WHERE EmployeeEmail = ? AND Year = ?',
      [accumulatedLeave, employeeEmail, currentYear]
    );

    res.json({ success: true, message: 'Accumulated leave updated successfully' });
  } catch (error) {
    console.error('Update accumulated leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to update accumulated leave' });
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
