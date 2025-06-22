
import express from 'express';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { HolidayService } from '../services/holidayService';

const router = express.Router();

// Bulk upload users
router.post('/users', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { data } = req.body;
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>
    };

    for (const [index, row] of data.entries()) {
      try {
        const { name, email, department, role = 'employee', password, manager_email, hire_date } = row;
        
        // Validate required fields
        if (!name || !email || !department || !password) {
          throw new Error('Missing required fields: name, email, department, password');
        }

        // Check if user already exists
        const existingUser = await executeQuery(
          'SELECT id FROM users WHERE email = ?',
          [email]
        );

        if (existingUser.length > 0) {
          throw new Error('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        await executeQuery(
          `INSERT INTO users (name, email, password, department, role, manager_email, hire_date, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            name,
            email,
            hashedPassword,
            department,
            role,
            manager_email || null,
            hire_date || new Date().toISOString().split('T')[0]
          ]
        );

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: row._rowNumber || index + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: row
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${data.length} records`,
      results
    });
  } catch (error) {
    console.error('Bulk upload users error:', error);
    res.status(500).json({ success: false, message: 'Failed to process bulk upload' });
  }
});

// Bulk upload balances
router.post('/balances', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { data } = req.body;
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>
    };

    for (const [index, row] of data.entries()) {
      try {
        const {
          employee_name,
          employee_email,
          department,
          year = new Date().getFullYear(),
          brought_forward = 0,
          annual = 20,
          annual_used = 0,
          forfeited = 0,
          annual_leave_adjustments = 0,
          sick_used = 0,
          family_used = 0,
          study_used = 0,
          manager_email
        } = row;

        // Validate required fields
        if (!employee_name || !employee_email) {
          throw new Error('Missing required fields: employee_name, employee_email');
        }

        // Check if balance already exists
        const existingBalance = await executeQuery(
          'SELECT BalanceID FROM leave_balances WHERE EmployeeEmail = ? AND Year = ?',
          [employee_email, year]
        );

        if (existingBalance.length > 0) {
          throw new Error(`Balance for ${employee_email} in year ${year} already exists`);
        }

        // Calculate current balance
        const currentBalance = parseFloat(brought_forward) + parseFloat(annual) - 
                              parseFloat(annual_used) - parseFloat(forfeited) - 
                              parseFloat(annual_leave_adjustments);

        // Insert balance
        await executeQuery(
          `INSERT INTO leave_balances (
            EmployeeName, EmployeeEmail, Department, Year, Broughtforward, Annual,
            AnnualUsed, Forfeited, Annual_leave_adjustments, SickUsed, FamilyUsed,
            StudyUsed, Current_leave_balance, Manager
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            employee_name,
            employee_email,
            department || 'Other',
            year,
            parseFloat(brought_forward) || 0,
            parseFloat(annual) || 20,
            parseFloat(annual_used) || 0,
            parseFloat(forfeited) || 0,
            parseFloat(annual_leave_adjustments) || 0,
            parseFloat(sick_used) || 0,
            parseFloat(family_used) || 0,
            parseFloat(study_used) || 0,
            currentBalance,
            manager_email || null
          ]
        );

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: row._rowNumber || index + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: row
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${data.length} records`,
      results
    });
  } catch (error) {
    console.error('Bulk upload balances error:', error);
    res.status(500).json({ success: false, message: 'Failed to process bulk upload' });
  }
});

// Bulk upload leave requests
router.post('/requests', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { data } = req.body;
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>
    };

    for (const [index, row] of data.entries()) {
      try {
        const {
          title,
          detail = '',
          start_date,
          end_date,
          leave_type = 'annual',
          requester_email,
          status = 'pending',
          approver_email
        } = row;

        // Validate required fields
        if (!title || !start_date || !end_date || !requester_email) {
          throw new Error('Missing required fields: title, start_date, end_date, requester_email');
        }

        // Calculate working days
        let workingDays = 1;
        try {
          workingDays = await HolidayService.calculateWorkingDaysExcludingHolidays(start_date, end_date);
        } catch (error) {
          console.log('Holiday calculation failed, using basic calculation');
          // Fallback calculation
          const start = new Date(start_date);
          const end = new Date(end_date);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          workingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }

        // Insert leave request
        await executeQuery(
          `INSERT INTO leave_taken (
            Title, Detail, StartDate, EndDate, LeaveType, Requester, Status,
            Approver, workingDays, Created, Modified_By
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
          [
            title,
            detail,
            start_date,
            end_date,
            leave_type,
            requester_email,
            status,
            approver_email || null,
            workingDays,
            req.user!.email
          ]
        );

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: row._rowNumber || index + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: row
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${data.length} records`,
      results
    });
  } catch (error) {
    console.error('Bulk upload requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to process bulk upload' });
  }
});

export default router;
