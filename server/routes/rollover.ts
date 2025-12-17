
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

    // Check if target year already exists
    const existingTargetYear = await executeQuery(
      'SELECT COUNT(*) as count FROM leave_balances WHERE Year = ?',
      [toYear]
    );

    if (existingTargetYear[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Leave balances for year ${toYear} already exist. Cannot perform rollover.` 
      });
    }

    // Start transaction
    await executeQuery('START TRANSACTION');

    try {
      // Get all active employee balances from the current year (this preserves the source data)
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

      // Verify backup exists by counting records before rollover
      const backupVerification = await executeQuery(
        'SELECT COUNT(*) as count FROM leave_balances WHERE Year = ?',
        [fromYear]
      );

      console.log(`Backup verification: ${backupVerification[0].count} records exist for year ${fromYear}`);

      // Create new year balances for each employee
      for (const balance of currentBalances) {
        // Calculate new brought forward (current annual leave balance)
        const newBroughtForward = balance.Broughtforward + balance.AccumulatedLeave - 
          balance.AnnualUsed - balance.Forfeited - balance.Annual_leave_adjustments;

        await executeQuery(`
          INSERT INTO leave_balances (
            EmployeeName, EmployeeEmail, Department, start_date, Status, Year,
            Broughtforward, Annual, AccumulatedLeave, AnnualUsed, Forfeited, Annual_leave_adjustments,
            SickBroughtforward, Sick, SickUsed,
            Maternity, MaternityUsed, Parental, ParentalUsed, 
            Family, FamilyUsed, Adoption, AdoptionUsed,
            Study, StudyUsed, Wellness, WellnessUsed,
            Manager, Contract_termination_date, Comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          balance.EmployeeName,
          balance.EmployeeEmail,
          balance.Department,
          balance.start_date, // Preserve original start_date from hire_date
          balance.Status,
          toYear, // Updated year
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
          balance.Wellness, // Reset Wellness allocation
          0, // Reset WellnessUsed to 0
          balance.Manager,
          balance.Contract_termination_date,
          `Rolled over from ${fromYear}`
        ]);
      }

      // Verify new records were created
      const newYearVerification = await executeQuery(
        'SELECT COUNT(*) as count FROM leave_balances WHERE Year = ?',
        [toYear]
      );

      // Verify backup still exists after rollover
      const backupStillExists = await executeQuery(
        'SELECT COUNT(*) as count FROM leave_balances WHERE Year = ?',
        [fromYear]
      );

      if (backupStillExists[0].count !== backupVerification[0].count) {
        await executeQuery('ROLLBACK');
        return res.status(500).json({
          success: false,
          message: 'Backup verification failed - previous year data was modified unexpectedly'
        });
      }

      // Commit transaction
      await executeQuery('COMMIT');

      // Log the rollover action with backup confirmation
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
          employeesProcessed: currentBalances.length,
          backupRecordsPreserved: backupStillExists[0].count,
          newRecordsCreated: newYearVerification[0].count
        }),
        req.user!.email
      ]);

      res.json({ 
        success: true, 
        message: `Successfully rolled over ${currentBalances.length} employee balances from ${fromYear} to ${toYear}. Previous year data preserved as backup.`,
        employeesProcessed: currentBalances.length,
        backupRecordsPreserved: backupStillExists[0].count,
        newRecordsCreated: newYearVerification[0].count
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

    // Check if target year already exists
    const existingTargetYear = await executeQuery(
      'SELECT COUNT(*) as count FROM leave_balances WHERE Year = ?',
      [toYear]
    );

    if (existingTargetYear[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Leave balances for year ${toYear} already exist. Cannot preview rollover.` 
      });
    }

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
      toYear: parseInt(toYear),
      backupNote: `All ${previewData.length} records for year ${fromYear} will be preserved as backup`
    });

  } catch (error) {
    console.error('Rollover preview error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate rollover preview' 
    });
  }
});

// Get backup verification - Admin only
router.get('/backup-status/:year', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { year } = req.params;

    const backupData = await executeQuery(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN Status = 'Active' THEN 1 END) as active_records,
        COUNT(CASE WHEN Status = 'Inactive' THEN 1 END) as inactive_records
      FROM leave_balances 
      WHERE Year = ?
    `, [year]);

    res.json({ 
      success: true, 
      year: parseInt(year),
      backup: backupData[0]
    });

  } catch (error) {
    console.error('Backup status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get backup status' 
    });
  }
});

export default router;
