
import express from 'express';
import { executeQuery } from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = express.Router();

// Helper function to normalize role comparison (case-insensitive)
const normalizeRole = (role: string): string => role?.toLowerCase() || '';

// Get employee balance
router.get('/:email', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { email } = req.params;
    const year = req.query.year || new Date().getFullYear();

    // Check if user has permission to view this balance
    if (normalizeRole(req.user!.role) === 'employee' && req.user!.email !== email) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const balances = await executeQuery(
      `SELECT lb.*, u.gender 
       FROM leave_balances lb 
       LEFT JOIN users u ON lb.EmployeeEmail = u.email 
       WHERE lb.EmployeeEmail = ? AND lb.Year = ?`,
      [email, year]
    );

    if (balances.length === 0) {
      return res.status(404).json({ success: false, message: 'Balance not found' });
    }

    const balance = balances[0];
    
    // Calculate accumulated leave dynamically based on start_date
    const startDate = balance.start_date || '2024-01-01';
    const terminationDate = balance.contract_termination_date || undefined;
    
    // Dynamic accumulated leave calculation (1.667 per month, prorated for start date)
    const calculateAccumulatedLeave = (currentDate = new Date(), terminationDate?: string, startDate?: string) => {
      const year = currentDate.getFullYear();
      const targetDate = terminationDate ? new Date(terminationDate) : currentDate;
      const calculationDate = targetDate.getFullYear() === year ? targetDate : currentDate;
      
      let employeeStartDate = new Date(startDate || '2024-01-01');
      if (employeeStartDate.getFullYear() < year) {
        employeeStartDate = new Date(year, 0, 1); // January 1st of current year
      }
      if (employeeStartDate > calculationDate) {
        return 0; // No accumulated leave if start date is after calculation date
      }
      
      let totalAccumulated = 0;
      const startMonth = employeeStartDate.getMonth();
      const startYear = employeeStartDate.getFullYear();
      
      if (startYear === year) {
        // First month proration
        const daysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
        const startDay = employeeStartDate.getDate();
        const daysWorkedInStartMonth = daysInStartMonth - startDay + 1;
        
        const startMonthEndDate = new Date(startYear, startMonth + 1, 0);
        if (calculationDate >= startMonthEndDate) {
          totalAccumulated += (daysWorkedInStartMonth / daysInStartMonth) * 1.667;
        }
        
        // Complete months after start month
        let currentMonth = startMonth + 1;
        let currentYear = startYear;
        
        while (currentYear < calculationDate.getFullYear() || 
               (currentYear === calculationDate.getFullYear() && currentMonth < calculationDate.getMonth())) {
          const monthEndDate = new Date(currentYear, currentMonth + 1, 0);
          if (calculationDate >= monthEndDate) {
            totalAccumulated += 1.667;
          }
          
          currentMonth += 1;
          if (currentMonth > 11) {
            currentMonth = 0;
            currentYear += 1;
          }
        }
      } else {
        // Started before current year - calculate complete months from Jan 1
        let currentMonth = 0;
        while (currentMonth < calculationDate.getMonth()) {
          const monthEndDate = new Date(year, currentMonth + 1, 0);
          if (calculationDate >= monthEndDate) {
            totalAccumulated += 1.667;
          }
          currentMonth += 1;
        }
      }
      
      return Math.min(totalAccumulated, 20); // Cap at 20 days
    };
    
    const dynamicAccumulatedLeave = Number(calculateAccumulatedLeave(new Date(), terminationDate, startDate).toFixed(3));
    
    // Update database if accumulated leave differs significantly
    if (Math.abs(dynamicAccumulatedLeave - (balance.AccumulatedLeave || 0)) > 0.001) {
      await executeQuery(
        'UPDATE leave_balances SET AccumulatedLeave = ? WHERE EmployeeEmail = ? AND Year = ?',
        [dynamicAccumulatedLeave, email, year]
      );
      console.log(`Updated accumulated leave for ${email}: ${balance.AccumulatedLeave} → ${dynamicAccumulatedLeave}`);
    }
    
    // Add Start_date mapping for frontend compatibility
    balance.Start_date = balance.start_date;
    balance.AccumulatedLeave = dynamicAccumulatedLeave;
    
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
      // Get current balance before update for audit
      const currentBalances = await executeQuery(
        'SELECT * FROM leave_balances WHERE EmployeeEmail = ? AND Year = ?',
        [employeeEmail, currentYear]
      );
      const oldBalance = currentBalances[0];

      params = [daysUsed, employeeEmail, currentYear];
      await executeQuery(updateQuery, params);

      // Log the balance update to audit
      await AuditService.logUpdate(
        'leave_balances', 
        oldBalance?.BalanceID || employeeEmail, 
        { [`${leaveType}Used`]: oldBalance?.[`${leaveType}Used`] || 0 },
        { 
          [`${leaveType}Used`]: (oldBalance?.[`${leaveType}Used`] || 0) + (action === 'approve' ? daysUsed : -daysUsed),
          action,
          leaveType,
          daysUsed
        },
        req.user!.email
      );
    }

    res.json({ success: true, message: 'Balance updated successfully' });
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({ success: false, message: 'Failed to update balance' });
  }
});

// Update accumulated leave in database (system calculation only)
router.put('/accumulated-leave', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { employeeEmail, accumulatedLeave, year } = req.body;
    const currentYear = year || new Date().getFullYear();

    // This endpoint is for automatic system calculations only
    // No role-based restrictions needed since it's a calculated field
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

// Get all balances (admin only, CD with view parameter)
router.get('/', authenticateToken, requireRole(['admin', 'cd', 'manager']), async (req: AuthRequest, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const viewParam = req.query.view || '';
    
    // Dynamic accumulated leave calculation function
    const calculateAccumulatedLeave = (currentDate = new Date(), terminationDate?: string, startDate?: string) => {
      const year = currentDate.getFullYear();
      const targetDate = terminationDate ? new Date(terminationDate) : currentDate;
      const calculationDate = targetDate.getFullYear() === year ? targetDate : currentDate;
      
      let employeeStartDate = new Date(startDate || '2024-01-01');
      if (employeeStartDate.getFullYear() < year) {
        employeeStartDate = new Date(year, 0, 1);
      }
      if (employeeStartDate > calculationDate) {
        return 0;
      }
      
      let totalAccumulated = 0;
      const startMonth = employeeStartDate.getMonth();
      const startYear = employeeStartDate.getFullYear();
      
      if (startYear === year) {
        const daysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
        const startDay = employeeStartDate.getDate();
        const daysWorkedInStartMonth = daysInStartMonth - startDay + 1;
        
        const startMonthEndDate = new Date(startYear, startMonth + 1, 0);
        if (calculationDate >= startMonthEndDate) {
          totalAccumulated += (daysWorkedInStartMonth / daysInStartMonth) * 1.667;
        }
        
        let currentMonth = startMonth + 1;
        let currentYear = startYear;
        
        while (currentYear < calculationDate.getFullYear() || 
               (currentYear === calculationDate.getFullYear() && currentMonth < calculationDate.getMonth())) {
          const monthEndDate = new Date(currentYear, currentMonth + 1, 0);
          if (calculationDate >= monthEndDate) {
            totalAccumulated += 1.667;
          }
          
          currentMonth += 1;
          if (currentMonth > 11) {
            currentMonth = 0;
            currentYear += 1;
          }
        }
      } else {
        let currentMonth = 0;
        while (currentMonth < calculationDate.getMonth()) {
          const monthEndDate = new Date(year, currentMonth + 1, 0);
          if (calculationDate >= monthEndDate) {
            totalAccumulated += 1.667;
          }
          currentMonth += 1;
        }
      }
      
      return Math.min(totalAccumulated, 20);
    };

    let balances;
    
    // CD can see all balances for dashboard, or only team balances if view=team parameter is set
    if ((normalizeRole(req.user!.role) === 'cd' || normalizeRole(req.user!.role) === 'manager') && viewParam === 'team') {
      // CD and Manager see only their managed team members
      console.log(`Fetching team balances for manager: ${req.user!.email}, year: ${year}`);
      
      // Use the users table manager_email field instead of leave_balances Manager field
      balances = await executeQuery(
        `SELECT lb.*, u.gender 
         FROM leave_balances lb 
         LEFT JOIN users u ON lb.EmployeeEmail = u.email 
         WHERE u.manager_email = ? AND lb.Year = ? AND u.is_active = 1 
         ORDER BY lb.EmployeeName`,
        [req.user!.email, year]
      );
      
      console.log(`Found ${balances.length} team members for manager ${req.user!.email}`);
    } else {
      // Admin sees all, CD sees all for dashboard
      balances = await executeQuery(
        `SELECT lb.*, u.gender 
         FROM leave_balances lb 
         LEFT JOIN users u ON lb.EmployeeEmail = u.email 
         WHERE lb.Year = ? ORDER BY lb.EmployeeName`,
        [year]
      );
    }

    // Update all balances with dynamic accumulated leave calculation
    const updatedBalances = await Promise.all(balances.map(async (balance: any) => {
      const startDate = balance.start_date || '2024-01-01';
      const terminationDate = balance.contract_termination_date || undefined;
      const dynamicAccumulatedLeave = Number(calculateAccumulatedLeave(new Date(), terminationDate, startDate).toFixed(3));
      
      // Update database if accumulated leave differs significantly
      if (Math.abs(dynamicAccumulatedLeave - (balance.AccumulatedLeave || 0)) > 0.001) {
        await executeQuery(
          'UPDATE leave_balances SET AccumulatedLeave = ? WHERE EmployeeEmail = ? AND Year = ?',
          [dynamicAccumulatedLeave, balance.EmployeeEmail, year]
        );
        console.log(`Updated accumulated leave for ${balance.EmployeeEmail}: ${balance.AccumulatedLeave} → ${dynamicAccumulatedLeave}`);
      }
      
      // Add Start_date mapping for frontend compatibility and update AccumulatedLeave
      return {
        ...balance,
        Start_date: balance.start_date,
        AccumulatedLeave: dynamicAccumulatedLeave
      };
    }));

    res.json({ success: true, balances: updatedBalances });
  } catch (error) {
    console.error('Get all balances error:', error);
    res.status(500).json({ success: false, message: 'Failed to get balances' });
  }
});

// Update complete balance record (admin only)
router.put('/update-full', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const balance = req.body;
    
    // Convert undefined values to null for MySQL compatibility
    const convertUndefinedToNull = (value: any) => value === undefined ? null : value;
    
    // Exclude generated columns that cannot be manually updated
    await executeQuery(`
      UPDATE leave_balances SET
        EmployeeName = ?, EmployeeEmail = ?, Department = ?, Year = ?,
        Broughtforward = ?, Annual = ?, AccumulatedLeave = ?, AnnualUsed = ?, 
        Forfeited = ?, Annual_leave_adjustments = ?, SickBroughtforward = ?, 
        Sick = ?, SickUsed = ?, Maternity = ?, MaternityUsed = ?, Parental = ?, 
        ParentalUsed = ?, Family = ?, FamilyUsed = ?, Adoption = ?, AdoptionUsed = ?, 
        Study = ?, StudyUsed = ?, Wellness = ?, WellnessUsed = ?,
        Leave_balance_previous_month = ?, Contract_termination_date = ?, 
        termination_balance = ?, Comment = ?, Annual_leave_adjustment_comments = ?, 
        Manager = ?, Modified = NOW()
      WHERE BalanceID = ?
    `, [
      convertUndefinedToNull(balance.EmployeeName), 
      convertUndefinedToNull(balance.EmployeeEmail), 
      convertUndefinedToNull(balance.Department), 
      convertUndefinedToNull(balance.Year),
      convertUndefinedToNull(balance.Broughtforward), 
      convertUndefinedToNull(balance.Annual), 
      convertUndefinedToNull(balance.AccumulatedLeave), 
      convertUndefinedToNull(balance.AnnualUsed),
      convertUndefinedToNull(balance.Forfeited), 
      convertUndefinedToNull(balance.Annual_leave_adjustments), 
      convertUndefinedToNull(balance.SickBroughtforward),
      convertUndefinedToNull(balance.Sick), 
      convertUndefinedToNull(balance.SickUsed), 
      convertUndefinedToNull(balance.Maternity), 
      convertUndefinedToNull(balance.MaternityUsed),
      convertUndefinedToNull(balance.Parental), 
      convertUndefinedToNull(balance.ParentalUsed), 
      convertUndefinedToNull(balance.Family), 
      convertUndefinedToNull(balance.FamilyUsed),
      convertUndefinedToNull(balance.Adoption), 
      convertUndefinedToNull(balance.AdoptionUsed), 
      convertUndefinedToNull(balance.Study), 
      convertUndefinedToNull(balance.StudyUsed),
      convertUndefinedToNull(balance.Wellness), 
      convertUndefinedToNull(balance.WellnessUsed), 
      convertUndefinedToNull(balance.Leave_balance_previous_month),
      convertUndefinedToNull(balance.Contract_termination_date), 
      convertUndefinedToNull(balance.termination_balance), 
      convertUndefinedToNull(balance.Comment), 
      convertUndefinedToNull(balance.Annual_leave_adjustment_comments), 
      convertUndefinedToNull(balance.Manager), 
      convertUndefinedToNull(balance.BalanceID)
    ]);

    res.json({ success: true, message: 'Balance updated successfully' });
  } catch (error) {
    console.error('Error updating complete balance:', error);
    res.status(500).json({ success: false, message: 'Failed to update balance' });
  }
});

// Update single field (admin only)
router.put('/update-field', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { BalanceID, field, value } = req.body;
    
    // Validate field name to prevent SQL injection
    // Exclude generated/computed columns like Current_leave_balance
    const allowedFields = [
      'Department', 'Manager', 'Forfeited', 'EmployeeName', 'EmployeeEmail',
      'Broughtforward', 'Annual', 'AccumulatedLeave', 'AnnualUsed', 
      'Annual_leave_adjustments', 'SickBroughtforward', 'Sick', 'SickUsed',
      'Maternity', 'MaternityUsed', 'Parental', 'ParentalUsed', 'Family',
      'FamilyUsed', 'Adoption', 'AdoptionUsed', 'Study', 'StudyUsed',
      'Wellness', 'WellnessUsed', 'Comment', 'Annual_leave_adjustment_comments',
      'Contract_termination_date', 'termination_balance', 'Leave_balance_previous_month'
    ];
    
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ success: false, message: 'Invalid field name' });
    }

    await executeQuery(`
      UPDATE leave_balances 
      SET ${field} = ?, Modified = NOW()
      WHERE BalanceID = ?
    `, [value, BalanceID]);

    res.json({ success: true, message: 'Field updated successfully' });
  } catch (error) {
    console.error('Error updating field:', error);
    res.status(500).json({ success: false, message: 'Failed to update field' });
  }
});

export default router;
