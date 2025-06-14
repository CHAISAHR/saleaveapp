
import express from 'express';
import { executeQuery } from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Year-end rollover - Admin only
router.post('/year-rollover', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { fromYear, toYear } = req.body;

    if (!fromYear || !toYear || toYear <= fromYear) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid year parameters' 
      });
    }

    // Start transaction
    await executeQuery('START TRANSACTION');

    try {
      // Get all active employee balances from the current year
      const currentBalances = await executeQuery(
        'SELECT * FROM leave_balances WHERE Year = ? AND Status = "Active"',
        [fromYear]
      );

      if (currentBalances.length === 0) {
        await executeQuery('ROLLBACK');
        return res.status(404).json({ 
          success: false, 
          message: `No active employee balances found for year ${fromYear}` 
        });
      }

      // Create new year balances for each employee
      for (const balance of currentBalances) {
        // Calculate new brought forward (current annual leave balance)
        const newBroughtForward = balance.Broughtforward + balance.AccumulatedLeave - 
          balance.AnnualUsed - balance.Forfeited - balance.Annual_leave_adjustments;

        await executeQuery(`
          INSERT INTO leave_balances (
            EmployeeName, EmployeeEmail, Department, Status, Year,
            Broughtforward, Annual, AccumulatedLeave, AnnualUsed, Forfeited, Annual_leave_adjustments,
            SickBroughtforward, Sick, SickUsed,
            Maternity, MaternityUsed, Parental, ParentalUsed, 
            Family, FamilyUsed, Adoption, AdoptionUsed,
            Study, StudyUsed, Mentalhealth, MentalhealthUsed,
            Manager, Contract_termination_date, Comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          balance.EmployeeName,
          balance.EmployeeEmail,
          balance.Department,
          balance.Status,
          toYear,
          Math.max(0, newBroughtForward), // Ensure non-negative brought forward
          balance.Annual, // Keep legacy annual field
          0, // Reset AccumulatedLeave to 0 for new year
          0, // Reset AnnualUsed to 0
          0, // Reset Forfeited to 0
          0, // Reset Annual_leave_adjustments to 0
          balance.SickBroughtforward, // Keep sick brought forward
          balance.Sick, // Keep sick allocation
          balance.SickUsed, // Keep sick used (don't reset)
          balance.Maternity, // Reset maternity allocation
          0, // Reset MaternityUsed to 0
          balance.Parental, // Reset parental allocation
          0, // Reset ParentalUsed to 0
          balance.Family, // Reset family allocation
          0, // Reset FamilyUsed to 0
          balance.Adoption, // Reset adoption allocation
          0, // Reset AdoptionUsed to 0
          balance.Study, // Reset study allocation
          0, // Reset StudyUsed to 0
          balance.Mentalhealth, // Reset mental health allocation
          0, // Reset MentalhealthUsed to 0
          balance.Manager,
          balance.Contract_termination_date,
          `Rolled over from ${fromYear}`
        ]);
      }

      // Commit transaction
      await executeQuery('COMMIT');

      // Log the rollover action
      await executeQuery(`
        INSERT INTO audit_log (table_name, record_id, action, new_values, changed_by, changed_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        'leave_balances',
        0, // Bulk operation
        'INSERT',
        JSON.stringify({ 
          operation: 'year_rollover', 
          fromYear, 
          toYear, 
          employeesProcessed: currentBalances.length 
        }),
        req.user!.email
      ]);

      res.json({ 
        success: true, 
        message: `Successfully rolled over ${currentBalances.length} employee balances from ${fromYear} to ${toYear}`,
        employeesProcessed: currentBalances.length
      });

    } catch (error) {
      // Rollback on error
      await executeQuery('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Year rollover error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to complete year rollover' 
    });
  }
});

// Get rollover preview - Admin only
router.get('/preview/:fromYear/:toYear', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { fromYear, toYear } = req.params;

    const previewData = await executeQuery(`
      SELECT 
        EmployeeName,
        EmployeeEmail,
        Department,
        Broughtforward,
        AccumulatedLeave,
        AnnualUsed,
        Forfeited,
        Annual_leave_adjustments,
        (Broughtforward + AccumulatedLeave - AnnualUsed - Forfeited - Annual_leave_adjustments) as current_balance,
        GREATEST(0, Broughtforward + AccumulatedLeave - AnnualUsed - Forfeited - Annual_leave_adjustments) as new_brought_forward
      FROM leave_balances 
      WHERE Year = ? AND Status = 'Active'
      ORDER BY EmployeeName
    `, [fromYear]);

    res.json({ 
      success: true, 
      preview: previewData,
      fromYear: parseInt(fromYear),
      toYear: parseInt(toYear)
    });

  } catch (error) {
    console.error('Rollover preview error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate rollover preview' 
    });
  }
});

export default router;
