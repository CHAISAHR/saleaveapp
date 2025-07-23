import express from 'express';
import multer from 'multer';
import { executeQuery } from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { emailService } from '../services/emailService';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Submit leave request with file attachments
router.post('/request', authenticateToken, upload.array('attachments', 10), async (req, res) => {
  try {
    console.log('=== LEAVE REQUEST START ===');
    console.log('Leave request received:', {
      body: req.body,
      user: (req as AuthRequest).user,
      hasFiles: !!(req.files && (req.files as Express.Multer.File[]).length > 0)
    });
    
    // Validate user authentication
    if (!(req as AuthRequest).user) {
      console.error('No authenticated user found');
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { title, detail, startDate, endDate, leaveType, workingDays, alternativeApprover, approverReason } = req.body;
    const requester = (req as AuthRequest).user!.email;
    const files = req.files as Express.Multer.File[];

    console.log('About to insert leave request with data:', {
      title, detail, startDate, endDate, leaveType, requester, workingDays
    });

    // Convert ISO date strings to MySQL DATE format (YYYY-MM-DD)
    const formatDateForMySQL = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Gets YYYY-MM-DD part
    };

    const formattedStartDate = formatDateForMySQL(startDate);
    const formattedEndDate = formatDateForMySQL(endDate);

    console.log('Date formatting:', { 
      originalStartDate: startDate, 
      formattedStartDate,
      originalEndDate: endDate,
      formattedEndDate 
    });

    // Test database connection first
    console.log('Testing database connection...');
    try {
      await executeQuery('SELECT 1 as test');
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      throw new Error('Database connection failed');
    }

    // Determine who the request should be sent to for approval
    let approverEmail = 'chaisahr@clintonhealthaccess.org'; // Default fallback
    
    if (alternativeApprover) {
      // Use alternative approver if specified
      approverEmail = alternativeApprover;
    } else {
      // Use default manager from users table
      const managerQuery = await executeQuery(
        'SELECT manager_email FROM users WHERE email = ?',
        [requester]
      );
      approverEmail = managerQuery[0]?.manager_email || 'chaisahr@clintonhealthaccess.org';
    }

    const result = await executeQuery(
      `INSERT INTO leave_taken (Title, Detail, StartDate, EndDate, LeaveType, Requester, Approver, AlternativeApprover, ApproverReason, Status, Created, workingDays) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), ?)`,
      [title, detail, formattedStartDate, formattedEndDate, leaveType, requester, approverEmail, alternativeApprover || null, approverReason || null, workingDays]
    );

    console.log('Leave request inserted successfully, ID:', result.insertId);

    const leaveId = result.insertId;

    // Store file attachments if any
    if (files && files.length > 0) {
      for (const file of files) {
        await executeQuery(
          `INSERT INTO leave_attachments (leave_id, filename, original_name, file_data, file_type, file_size) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [leaveId, `${Date.now()}_${file.originalname}`, file.originalname, file.buffer, file.mimetype, file.size]
        );
      }
    }

    // Use the approver email for notifications (already determined above)
    const managerEmail = approverEmail;
    console.log('Sending notification to approver:', managerEmail);
    
    // Send email notification to manager (non-blocking)
    const leaveRequest = {
      title,
      description: detail,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      leaveType,
      workingDays,
      submittedBy: requester
    };

    try {
      await emailService.notifyManagerOfLeaveRequest(leaveRequest, managerEmail);
      console.log(`Email notification sent to manager: ${managerEmail}`);
    } catch (emailError) {
      console.error('Failed to send email notification (non-blocking):', emailError);
      // Don't fail the whole request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      leaveId: leaveId
    });
  } catch (error) {
    const errorDetails = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: req.body,
      userEmail: (req as AuthRequest).user?.email,
      timestamp: new Date().toISOString()
    };
    console.error('Leave request error details:', errorDetails);
    res.status(500).json({ success: false, message: 'Failed to submit leave request' });
  }
});

// Get leave requests (filtered by role)
router.get('/requests', authenticateToken, async (req: AuthRequest, res) => {
  try {
    let query = '';
    let params: any[] = [];

    if (req.user!.role === 'admin') {
      // Admin can see all requests with attachments and alternative approver info
      query = `SELECT lt.LeaveID, lt.Title, lt.Detail, lt.StartDate, lt.EndDate, lt.LeaveType, 
               lt.Requester, lt.Approver, lt.AlternativeApprover, lt.ApproverReason, lt.Status, lt.Created, lt.Modified, lt.Modified_By,
               lt.workingDays, COUNT(la.id) as attachment_count
               FROM leave_taken lt 
               LEFT JOIN leave_attachments la ON lt.LeaveID = la.leave_id
               GROUP BY lt.LeaveID ORDER BY lt.Created DESC`;
    } else if (req.user!.role === 'manager') {
      // Manager can see their team's requests, requests where they're alternative approver, and their own requests
      query = `SELECT lt.LeaveID, lt.Title, lt.Detail, lt.StartDate, lt.EndDate, lt.LeaveType, 
               lt.Requester, lt.Approver, lt.AlternativeApprover, lt.ApproverReason, lt.Status, lt.Created, lt.Modified, lt.Modified_By,
               lt.workingDays, COUNT(la.id) as attachment_count
               FROM leave_taken lt 
               LEFT JOIN leave_attachments la ON lt.LeaveID = la.leave_id
               LEFT JOIN leave_balances lb ON lt.Requester = lb.EmployeeEmail 
               WHERE lb.Manager = ? OR lt.Requester = ? OR lt.AlternativeApprover = ?
               GROUP BY lt.LeaveID ORDER BY lt.Created DESC`;
      params = [req.user!.email, req.user!.email, req.user!.email];
    } else {
      // Employee can only see their own requests with attachments and alternative approver info
      query = `SELECT lt.LeaveID, lt.Title, lt.Detail, lt.StartDate, lt.EndDate, lt.LeaveType, 
               lt.Requester, lt.Approver, lt.AlternativeApprover, lt.ApproverReason, lt.Status, lt.Created, lt.Modified, lt.Modified_By,
               lt.workingDays, COUNT(la.id) as attachment_count
               FROM leave_taken lt 
               LEFT JOIN leave_attachments la ON lt.LeaveID = la.leave_id
               WHERE lt.Requester = ? 
               GROUP BY lt.LeaveID ORDER BY lt.Created DESC`;
      params = [req.user!.email];
    }

    const requests = await executeQuery(query, params);
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to get leave requests' });
  }
});

// Update leave request by employee (employee only, for their own pending requests)
router.put('/requests/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, detail, startDate, endDate, leaveType, workingDays } = req.body;
    const requesterEmail = (req as AuthRequest).user!.email;

    // First check if the request exists and belongs to the user
    const existingRequest = await executeQuery(
      'SELECT * FROM leave_taken WHERE LeaveID = ? AND Requester = ?',
      [id, requesterEmail]
    );

    if (existingRequest.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave request not found or access denied' });
    }

    const request = existingRequest[0];

    // Check if request can be edited (only pending and start date hasn't passed)
    if (request.Status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Cannot edit non-pending requests' });
    }

    const requestStartDate = new Date(request.StartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestStartDate <= today) {
      return res.status(400).json({ success: false, message: 'Cannot edit requests where the first day has passed' });
    }

    // Format dates for MySQL
    const formatDateForMySQL = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    const formattedStartDate = formatDateForMySQL(startDate);
    const formattedEndDate = formatDateForMySQL(endDate);

    // Update the request
    await executeQuery(
      `UPDATE leave_taken SET Title = ?, Detail = ?, StartDate = ?, EndDate = ?, LeaveType = ?, workingDays = ?, Modified = NOW(), Modified_By = ? 
       WHERE LeaveID = ?`,
      [title, detail, formattedStartDate, formattedEndDate, leaveType, workingDays, requesterEmail, id]
    );

    // Get the updated request for email notification
    const updatedRequest = await executeQuery(
      'SELECT * FROM leave_taken WHERE LeaveID = ?',
      [id]
    );

    if (updatedRequest.length > 0) {
      const leave = updatedRequest[0];
      
      // Send email notification to manager (like a new request)
      const leaveRequest = {
        title: leave.Title,
        description: leave.Detail,
        startDate: leave.StartDate,
        endDate: leave.EndDate,
        leaveType: leave.LeaveType,
        workingDays: leave.workingDays,
        submittedBy: leave.Requester
      };

      try {
        await emailService.notifyManagerOfLeaveRequest(leaveRequest, leave.Approver, true); // true indicates it's an edit
        console.log(`Email notification sent to manager for edited request: ${leave.Approver}`);
      } catch (emailError) {
        console.error('Failed to send email notification for edited request (non-blocking):', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Leave request updated successfully'
    });
  } catch (error) {
    console.error('Update leave request error:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave request' });
  }
});

// Update leave request status (manager/admin only)
router.put('/requests/:id/status', authenticateToken, requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, approver, reason } = req.body;

    await executeQuery(
      'UPDATE leave_taken SET Status = ?, Modified = NOW(), Modified_By = ? WHERE LeaveID = ?',
      [status, req.user!.email, id]
    );

    // Get leave request details for email notification
    const leaveDetails = await executeQuery(
      'SELECT * FROM leave_taken WHERE LeaveID = ?',
      [id]
    );

    if (leaveDetails.length > 0) {
      const leave = leaveDetails[0];
      const approverName = req.user!.email;

      // Send email notification based on status
      if (status === 'approved') {
        await emailService.notifyEmployeeOfApproval(leave, approverName);
        console.log(`Approval email notification sent to: ${leave.Requester}`);
      } else if (status === 'rejected') {
        await emailService.notifyEmployeeOfRejection(leave, approverName, reason);
        console.log(`Rejection email notification sent to: ${leave.Requester}`);
      }
    }

    res.json({
      success: true,
      message: 'Leave request status updated successfully'
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave request status' });
  }
});

// Automatic forfeit leave endpoint (to be called by cron job or scheduled task)
router.post('/auto-forfeit', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const isAfterJuly31 = currentDate > new Date(currentYear, 6, 31); // July is month 6 (0-indexed)

    if (!isAfterJuly31) {
      return res.json({
        success: false,
        message: 'Automatic forfeit only runs after July 31st'
      });
    }

    // Get all balances where brought forward leave should be forfeited
    const balancesToUpdate = await executeQuery(
      `SELECT BalanceID, EmployeeName, EmployeeEmail, Broughtforward, AnnualUsed, Forfeited
       FROM leave_balances 
       WHERE Year = ? AND (Broughtforward - AnnualUsed - Forfeited) > 0`,
      [currentYear]
    );

    let totalForfeited = 0;
    const updatedEmployees = [];

    for (const balance of balancesToUpdate) {
      const forfeitAmount = Math.max(0, balance.Broughtforward - balance.AnnualUsed - balance.Forfeited);
      
      if (forfeitAmount > 0) {
        await executeQuery(
          'UPDATE leave_balances SET Forfeited = Forfeited + ?, Modified = NOW() WHERE BalanceID = ?',
          [forfeitAmount, balance.BalanceID]
        );
        
        totalForfeited += forfeitAmount;
        updatedEmployees.push({
          name: balance.EmployeeName,
          email: balance.EmployeeEmail,
          forfeited: forfeitAmount
        });
      }
    }

    res.json({
      success: true,
      message: `Automatically forfeited ${totalForfeited} days of brought forward leave for ${updatedEmployees.length} employees`,
      totalForfeited,
      updatedEmployees
    });
  } catch (error) {
    console.error('Auto forfeit error:', error);
    res.status(500).json({ success: false, message: 'Failed to auto-forfeit leave' });
  }
});

// API endpoints for external systems
router.get('/api/external/balances/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const year = req.query.year || new Date().getFullYear();
    
    const balance = await executeQuery(
      'SELECT * FROM leave_balances WHERE EmployeeEmail = ? AND Year = ?',
      [email, year]
    );

    if (balance.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, balance: balance[0] });
  } catch (error) {
    console.error('External balance API error:', error);
    res.status(500).json({ success: false, message: 'Failed to get balance' });
  }
});

router.get('/api/external/requests/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const year = req.query.year || new Date().getFullYear();
    
    const requests = await executeQuery(
      `SELECT LeaveID, Title, StartDate, EndDate, LeaveType, Status, workingDays, Created 
       FROM leave_taken 
       WHERE Requester = ? AND YEAR(StartDate) = ? 
       ORDER BY Created DESC`,
      [email, year]
    );

    res.json({ success: true, requests });
  } catch (error) {
    console.error('External requests API error:', error);
    res.status(500).json({ success: false, message: 'Failed to get requests' });
  }
});

export default router;
