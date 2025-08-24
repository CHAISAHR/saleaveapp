import express from 'express';
import multer from 'multer';
import { executeQuery } from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { emailService } from '../services/emailService';
import { AuditService } from '../services/auditService';

const router = express.Router();

// Helper function to normalize role comparison (case-insensitive)
const normalizeRole = (role: string): string => role?.toLowerCase() || '';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Update leave request (employees can edit pending requests)
router.put('/:leaveId', authenticateToken, async (req, res) => {
  try {
    console.log('=== LEAVE REQUEST UPDATE START ===');
    console.log('Update request received:', {
      leaveId: req.params.leaveId,
      body: req.body,
      user: (req as AuthRequest).user
    });

    // Validate user authentication
    if (!(req as AuthRequest).user) {
      console.error('No authenticated user found');
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { leaveId } = req.params;
    const { title, detail, startDate, endDate, leaveType, workingDays } = req.body;
    const requester = (req as AuthRequest).user!.email;

    // Check if the leave request exists and belongs to the user
    const existingRequest = await executeQuery(
      'SELECT * FROM leave_taken WHERE LeaveID = ? AND Requester = ?',
      [leaveId, requester]
    );

    if (existingRequest.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Leave request not found or access denied' 
      });
    }

    const request = existingRequest[0];

    // Check if request is pending
    if (request.Status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only edit pending leave requests' 
      });
    }

    // Check if start date hasn't passed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestStartDate = new Date(request.StartDate);
    requestStartDate.setHours(0, 0, 0, 0);

    if (requestStartDate < today) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot edit leave requests after the start date has passed' 
      });
    }

    // Convert ISO date strings to MySQL DATE format
    const formatDateForMySQL = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    const formattedStartDate = formatDateForMySQL(startDate);
    const formattedEndDate = formatDateForMySQL(endDate);

    // Check for overlapping leave requests (excluding current request being updated)
    const overlapCheck = await executeQuery(
      `SELECT LeaveID, LeaveType, StartDate, EndDate, Status FROM leave_taken 
       WHERE Requester = ? 
       AND LeaveID != ?
       AND Status IN ('pending', 'approved') 
       AND NOT (EndDate < ? OR StartDate > ?)
       ORDER BY StartDate`,
      [requester, leaveId, formattedStartDate, formattedEndDate]
    );

    if (overlapCheck.length > 0) {
      const conflictingRequest = overlapCheck[0];
      console.log('Overlapping request detected during update:', conflictingRequest);
      return res.status(409).json({ 
        success: false, 
        message: `You already have ${conflictingRequest.Status} leave from ${conflictingRequest.StartDate} to ${conflictingRequest.EndDate} (${conflictingRequest.LeaveType}). Leave dates cannot overlap.`,
        conflictingRequest: {
          id: conflictingRequest.LeaveID,
          type: conflictingRequest.LeaveType,
          startDate: conflictingRequest.StartDate,
          endDate: conflictingRequest.EndDate,
          status: conflictingRequest.Status
        }
      });
    }


    console.log('Date formatting for update:', { 
      originalStartDate: startDate, 
      formattedStartDate,
      originalEndDate: endDate,
      formattedEndDate 
    });

    // Update the leave request
    await executeQuery(
      `UPDATE leave_taken 
       SET Title = ?, Detail = ?, StartDate = ?, EndDate = ?, LeaveType = ?, workingDays = ?, 
           Modified = NOW(), Modified_By = ?, Status = 'pending'
       WHERE LeaveID = ?`,
      [title, detail, formattedStartDate, formattedEndDate, leaveType, workingDays, requester, leaveId]
    );

    console.log('Leave request updated successfully, ID:', leaveId);

    // Log leave request update to audit
    await AuditService.logUpdate('leave_taken', leaveId, 
      {
        title: request.Title,
        detail: request.Detail,
        startDate: request.StartDate,
        endDate: request.EndDate,
        leaveType: request.LeaveType,
        workingDays: request.workingDays,
        status: request.Status
      },
      {
        title: title,
        detail: detail,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        leaveType: leaveType,
        workingDays: workingDays,
        status: 'pending'
      },
      requester
    );

    // Get updated request data for notifications
    const updatedRequestData = {
      LeaveID: leaveId,
      Title: title,
      Detail: detail,
      StartDate: formattedStartDate,
      EndDate: formattedEndDate,
      LeaveType: leaveType,
      Requester: requester,
      Approver: request.Approver,
      workingDays: workingDays
    };

    // Send email notification to manager about the updated request
    try {
      await emailService.notifyManagerOfLeaveRequest(
        {
          ...updatedRequestData,
          title,
          description: detail,
          leaveType,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          submittedBy: requester
        },
        request.Approver
      );
      console.log('Manager notification sent for updated leave request');
    } catch (emailError) {
      console.error('Failed to send manager notification for updated request:', emailError);
      // Don't fail the request if email fails
    }

    console.log('=== LEAVE REQUEST UPDATE END ===');
    res.json({ 
      success: true, 
      message: 'Leave request updated successfully',
      leaveId: leaveId 
    });

  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update leave request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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

    // Check for duplicate requests (same user, same dates, same type, within last 5 minutes)
    const duplicateCheck = await executeQuery(
      `SELECT LeaveID FROM leave_taken 
       WHERE Requester = ? AND StartDate = ? AND EndDate = ? AND LeaveType = ? 
       AND Created > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
       ORDER BY Created DESC LIMIT 1`,
      [requester, startDate, endDate, leaveType]
    );

    if (duplicateCheck.length > 0) {
      console.log('Duplicate request detected:', duplicateCheck[0].LeaveID);
      return res.status(409).json({ 
        success: false, 
        message: 'A similar leave request was already submitted recently. Please check your existing requests.',
        duplicateId: duplicateCheck[0].LeaveID
      });
    }

    // Convert ISO date strings to MySQL DATE format (YYYY-MM-DD) for overlap check
    const formatDateForMySQL = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    const formattedStartDate = formatDateForMySQL(startDate);
    const formattedEndDate = formatDateForMySQL(endDate);

    // Check for overlapping leave requests (same user, overlapping dates, regardless of leave type)
    const overlapCheck = await executeQuery(
      `SELECT LeaveID, LeaveType, StartDate, EndDate, Status FROM leave_taken 
       WHERE Requester = ? 
       AND Status IN ('pending', 'approved') 
       AND NOT (EndDate < ? OR StartDate > ?)
       ORDER BY StartDate`,
      [requester, formattedStartDate, formattedEndDate]
    );

    if (overlapCheck.length > 0) {
      const conflictingRequest = overlapCheck[0];
      console.log('Overlapping request detected:', conflictingRequest);
      return res.status(409).json({ 
        success: false, 
        message: `You already have ${conflictingRequest.Status} leave from ${conflictingRequest.StartDate} to ${conflictingRequest.EndDate} (${conflictingRequest.LeaveType}). Leave dates cannot overlap.`,
        conflictingRequest: {
          id: conflictingRequest.LeaveID,
          type: conflictingRequest.LeaveType,
          startDate: conflictingRequest.StartDate,
          endDate: conflictingRequest.EndDate,
          status: conflictingRequest.Status
        }
      });
    }

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

    // Log leave request creation to audit
    await AuditService.logInsert('leave_taken', leaveId, {
      title,
      detail,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      leaveType,
      requester,
      approver: approverEmail,
      alternativeApprover,
      status: 'pending',
      workingDays
    }, requester);

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

    // Check if leave request exceeds available balance
    let availableBalance = 0;
    let employeeName = '';
    
    try {
      // Get employee's current balance and name
      const balanceQuery = await executeQuery(
        'SELECT annual_leave, name FROM leave_balances lb JOIN users u ON lb.email = u.email WHERE lb.email = ?',
        [requester]
      );
      
      if (balanceQuery.length > 0) {
        availableBalance = balanceQuery[0].annual_leave || 0;
        employeeName = balanceQuery[0].name || requester;
        
        // Check if requested days exceed available balance
        if (workingDays > availableBalance) {
          console.log(`Balance exceeded: Requested ${workingDays} days, available ${availableBalance} days`);
          
          // Send urgent notification to HR & Ops manager
          await emailService.notifyHROfBalanceExceeded(
            {
              Requester: requester,
              LeaveType: leaveType,
              StartDate: formattedStartDate,
              EndDate: formattedEndDate,
              Detail: detail,
              LeaveID: leaveId
            },
            employeeName,
            availableBalance,
            workingDays
          );
        }
      }
    } catch (balanceError) {
      console.error('Error checking balance:', balanceError);
      // Continue with normal flow even if balance check fails
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
    const currentYear = new Date().getFullYear();

    if (normalizeRole(req.user!.role) === 'admin') {
      // Admin can see all requests (no year filtering for admin)
      query = `SELECT lt.LeaveID, lt.Title, lt.Detail, lt.StartDate, lt.EndDate, lt.LeaveType, 
               lt.Requester, lt.Approver, lt.AlternativeApprover, lt.ApproverReason, lt.Status, lt.Created, lt.Modified, 
               lt.Modified_By, u.name as ModifiedBy, lt.workingDays, COUNT(la.id) as attachment_count
               FROM leave_taken lt 
               LEFT JOIN leave_attachments la ON lt.LeaveID = la.leave_id
               LEFT JOIN users u ON lt.Modified_By = u.email
               GROUP BY lt.LeaveID ORDER BY lt.Created DESC`;
    } else if (normalizeRole(req.user!.role) === 'cd') {
      // CD can see all requests for dashboard, or only team requests if view=team parameter is set
      const viewParam = req.query.view || '';
      if (viewParam === 'team') {
        // CD sees requests from users they manage (via manager_email), requests they approve, or their own requests
        query = `SELECT lt.LeaveID, lt.Title, lt.Detail, lt.StartDate, lt.EndDate, lt.LeaveType, 
                 lt.Requester, lt.Approver, lt.AlternativeApprover, lt.ApproverReason, lt.Status, lt.Created, lt.Modified, 
                 lt.Modified_By, u.name as ModifiedBy, lt.workingDays, COUNT(la.id) as attachment_count
                 FROM leave_taken lt 
                 LEFT JOIN leave_attachments la ON lt.LeaveID = la.leave_id
                 LEFT JOIN users u ON lt.Modified_By = u.email
                 LEFT JOIN users requester_user ON lt.Requester = requester_user.email
                 WHERE (requester_user.manager_email = ? OR 
                        lt.Approver = ? OR 
                        lt.AlternativeApprover = ? OR 
                        lt.Requester = ?) 
                        AND YEAR(lt.StartDate) = ?
                 GROUP BY lt.LeaveID ORDER BY lt.Created DESC`;
        params = [req.user!.email, req.user!.email, req.user!.email, req.user!.email, currentYear];
      } else {
        // CD sees all requests (like admin view) for dashboard
        query = `SELECT lt.LeaveID, lt.Title, lt.Detail, lt.StartDate, lt.EndDate, lt.LeaveType, 
                 lt.Requester, lt.Approver, lt.AlternativeApprover, lt.ApproverReason, lt.Status, lt.Created, lt.Modified, 
                 lt.Modified_By, u.name as ModifiedBy, lt.workingDays, COUNT(la.id) as attachment_count
                 FROM leave_taken lt 
                 LEFT JOIN leave_attachments la ON lt.LeaveID = la.leave_id
                 LEFT JOIN users u ON lt.Modified_By = u.email
                 GROUP BY lt.LeaveID ORDER BY lt.Created DESC`;
      }
    } else if (normalizeRole(req.user!.role) === 'manager') {
      // Manager can see current year requests only:
      // 1. Requests where they are the approver (but not their own requests)
      // 2. Requests where they are the alternative approver (but not their own requests)  
      // 3. Their own requests (for viewing only, not for approval)
      query = `SELECT lt.LeaveID, lt.Title, lt.Detail, lt.StartDate, lt.EndDate, lt.LeaveType, 
               lt.Requester, lt.Approver, lt.AlternativeApprover, lt.ApproverReason, lt.Status, lt.Created, lt.Modified, 
               lt.Modified_By, u.name as ModifiedBy, lt.workingDays, COUNT(la.id) as attachment_count
               FROM leave_taken lt 
               LEFT JOIN leave_attachments la ON lt.LeaveID = la.leave_id
               LEFT JOIN users u ON lt.Modified_By = u.email
               WHERE ((lt.Approver = ? AND lt.Requester != ?) OR 
                     (lt.AlternativeApprover = ? AND lt.Requester != ?) OR 
                     lt.Requester = ?) 
                     AND YEAR(lt.StartDate) = ?
               GROUP BY lt.LeaveID ORDER BY lt.Created DESC`;
      params = [req.user!.email, req.user!.email, req.user!.email, req.user!.email, req.user!.email, currentYear];
    } else {
      // Employee can only see their own requests for current year
      query = `SELECT lt.LeaveID, lt.Title, lt.Detail, lt.StartDate, lt.EndDate, lt.LeaveType, 
               lt.Requester, lt.Approver, lt.AlternativeApprover, lt.ApproverReason, lt.Status, lt.Created, lt.Modified, 
               lt.Modified_By, u.name as ModifiedBy, lt.workingDays, COUNT(la.id) as attachment_count
               FROM leave_taken lt 
               LEFT JOIN leave_attachments la ON lt.LeaveID = la.leave_id
               LEFT JOIN users u ON lt.Modified_By = u.email
               WHERE lt.Requester = ? AND YEAR(lt.StartDate) = ?
               GROUP BY lt.LeaveID ORDER BY lt.Created DESC`;
      params = [req.user!.email, currentYear];
    }

    console.log(`Fetching leave requests for role: ${req.user!.role}, user: ${req.user!.email}, view: ${req.query.view || 'default'}, year filter: ${normalizeRole(req.user!.role) === 'admin' || (normalizeRole(req.user!.role) === 'cd' && req.query.view !== 'team') ? 'none' : currentYear}`);

    const requests = await executeQuery(query, params);
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to get leave requests' });
  }
});

// Update leave request status (manager/admin only)
router.put('/requests/:id/status', authenticateToken, requireRole(['manager', 'admin', 'cd']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, approver, reason } = req.body;

    // Get current leave request for validation and audit
    const currentLeave = await executeQuery(
      'SELECT * FROM leave_taken WHERE LeaveID = ?',
      [id]
    );

    if (currentLeave.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    // Prevent self-approval: managers and country directors cannot approve their own leave requests
    if ((normalizeRole(req.user!.role) === 'manager' || normalizeRole(req.user!.role) === 'cd') && currentLeave[0].Requester === req.user!.email) {
      return res.status(403).json({ 
        success: false, 
        message: 'You cannot approve your own leave request' 
      });
    }

    await executeQuery(
      'UPDATE leave_taken SET Status = ?, Modified = NOW(), Modified_By = ? WHERE LeaveID = ?',
      [status, req.user!.email, id]
    );

    // Log status change to audit
    if (currentLeave.length > 0) {
      await AuditService.logUpdate(
        'leave_taken',
        id,
        { status: currentLeave[0].Status },
        { status, modified_by: req.user!.email, reason },
        req.user!.email
      );
    }

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
      } else if (status === 'declined') {
        await emailService.notifyEmployeeOfRejection(leave, approverName, reason);
        // Also notify HR & Ops manager of rejection
        await emailService.notifyHROfLeaveRejection(leave, leave.Requester, reason, approverName);
        console.log(`Rejection email notification sent to: ${leave.Requester} and HR`);
      } else if (status === 'cancelled') {
        // Notify HR & Ops manager of cancellation
        await emailService.notifyHROfLeaveCancellation(leave, leave.Requester, reason, approverName);
        console.log(`Cancellation email notification sent to HR`);
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

// Manual forfeit leave endpoint - calculates forfeit based on annual leave taken before July 31st
router.post('/manual-forfeit', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const july31 = new Date(currentYear, 6, 31); // July is month 6 (0-indexed)

    // Get all balances for current year
    const allBalances = await executeQuery(
      `SELECT BalanceID, EmployeeName, EmployeeEmail, Broughtforward, AnnualUsed, Forfeited, Annual_leave_adjustments
       FROM leave_balances 
       WHERE Year = ?`,
      [currentYear]
    );

    let totalForfeited = 0;
    const updatedEmployees = [];

    for (const balance of allBalances) {
      // Calculate annual leave taken before July 31st for this employee
      const leaveBeforeJuly31Query = await executeQuery(
        `SELECT COALESCE(SUM(workingDays), 0) as leaveTakenBeforeJuly31
         FROM leave_taken 
         WHERE Requester = ? 
         AND YEAR(StartDate) = ? 
         AND LeaveType = 'annual' 
         AND Status = 'approved'
         AND StartDate <= ?`,
        [balance.EmployeeEmail, currentYear, july31.toISOString().split('T')[0]]
      );

      const leaveTakenBeforeJuly31 = leaveBeforeJuly31Query[0]?.leaveTakenBeforeJuly31 || 0;
      
      // Calculate forfeit amount: broughtforward - (leave taken before July 31st) - (annual leave adjustments)
      const forfeitAmount = Math.max(0, balance.Broughtforward - leaveTakenBeforeJuly31 - balance.Annual_leave_adjustments);
      
      if (forfeitAmount > 0) {
        // Update the forfeit amount in the database
        await executeQuery(
          'UPDATE leave_balances SET Forfeited = ?, Modified = NOW() WHERE BalanceID = ?',
          [forfeitAmount, balance.BalanceID]
        );
        
        totalForfeited += forfeitAmount;
        updatedEmployees.push({
          name: balance.EmployeeName,
          email: balance.EmployeeEmail,
          forfeited: forfeitAmount,
          broughtforward: balance.Broughtforward,
          leaveTakenBeforeJuly31,
          adjustments: balance.Annual_leave_adjustments
        });
      }
    }

    res.json({
      success: true,
      message: `Manually forfeited ${totalForfeited.toFixed(1)} days of brought forward leave for ${updatedEmployees.length} employees`,
      totalForfeited,
      updatedEmployees,
      employeesAffected: updatedEmployees.length
    });
  } catch (error) {
    console.error('Manual forfeit error:', error);
    res.status(500).json({ success: false, message: 'Failed to forfeit leave' });
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

// Get documents for managers and admins
router.get('/documents', authenticateToken, requireRole(['manager', 'admin', 'cd']), async (req: AuthRequest, res) => {
    try {
        console.log(`[Documents] ${req.method} ${req.path} - User: ${req.user!.email} (${req.user!.role})`);

        // Test database connectivity first
        try {
            await executeQuery('SELECT 1 as test');
            console.log('[Documents] Database connection test successful');
        } catch (dbError) {
            console.error('[Documents] Database connection test failed:', dbError);
            return res.status(500).json({ success: false, message: 'Database connection failed' });
        }

        // Check if tables exist
        try {
            const tableCheck = await executeQuery(`
                SELECT COUNT(*) as count FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name IN ('leave_attachments', 'leave_taken', 'users')
            `);
            console.log('[Documents] Table check result:', tableCheck);
            
            if (tableCheck[0]?.count < 3) {
                console.error('[Documents] Missing required tables');
                return res.status(500).json({ success: false, message: 'Database tables not found' });
            }
        } catch (tableError) {
            console.error('[Documents] Table check failed:', tableError);
            return res.status(500).json({ success: false, message: 'Failed to verify database tables' });
        }

        // Check which timestamp column exists in leave_attachments table
        let timestampColumn = 'created_at';
        try {
            const columnCheck = await executeQuery(`
                SELECT COLUMN_NAME FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'leave_attachments' 
                AND COLUMN_NAME IN ('created_at', 'uploaded_at')
            `);
            
            console.log('[Documents] Available timestamp columns:', columnCheck);
            
            // Use uploaded_at if created_at doesn't exist
            if (columnCheck.length > 0) {
                if (columnCheck.some((col: any) => col.COLUMN_NAME === 'created_at')) {
                    timestampColumn = 'created_at';
                } else if (columnCheck.some((col: any) => col.COLUMN_NAME === 'uploaded_at')) {
                    timestampColumn = 'uploaded_at';
                }
            }
        } catch (columnError) {
            console.error('[Documents] Column check failed, using default:', columnError);
            timestampColumn = 'uploaded_at'; // Fallback to old column name
        }

        console.log('[Documents] Using timestamp column:', timestampColumn);

        let query = '';
        let params: any[] = [];

        if (normalizeRole(req.user!.role) === 'admin') {
            // Admin can see all documents
            query = `
                SELECT
                    la.id, la.leave_id, la.filename, la.original_name, la.file_type, la.file_size, la.${timestampColumn} as uploaded_at,
                    lt.Title as leave_title, lt.LeaveType as leave_type, lt.Requester as requester_email,
                    u.name as requester_name,
                    u.department as department_name
                FROM leave_attachments la
                JOIN leave_taken lt ON la.leave_id = lt.LeaveID
                JOIN users u ON lt.Requester = u.email
                ORDER BY la.${timestampColumn} DESC
            `;
        } else if (normalizeRole(req.user!.role) === 'manager' || normalizeRole(req.user!.role) === 'cd') {
            // Manager can see documents from their team and alternative approvals
            query = `
                SELECT
                    la.id, la.leave_id, la.filename, la.original_name, la.file_type, la.file_size, la.${timestampColumn} as uploaded_at,
                    lt.Title as leave_title, lt.LeaveType as leave_type, lt.Requester as requester_email,
                    u.name as requester_name,
                    u.department as department_name
                FROM leave_attachments la
                JOIN leave_taken lt ON la.leave_id = lt.LeaveID
                JOIN users u ON lt.Requester = u.email
                LEFT JOIN leave_balances lb ON lt.Requester = lb.EmployeeEmail
                WHERE (lb.Manager = ? OR lt.AlternativeApprover = ?) AND lt.Requester != ?
                ORDER BY la.${timestampColumn} DESC
            `;
            params = [req.user!.email, req.user!.email, req.user!.email];
        } else {
            // If an employee role tries to access this endpoint without manager/admin role
            return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to view documents.' });
        }

        console.log('[Documents] Executing query:', query);
        console.log('[Documents] Query parameters:', params);

        const documents = await executeQuery(query, params);

        console.log(`[Documents] Found ${documents.length} documents`);
        if (documents.length > 0) {
            console.log('[Documents] Sample document:', documents[0]);
        }

        res.json({
            success: true,
            documents: documents
        });
    } catch (error) {
        console.error('[Documents] Error fetching documents:', error);
        console.error('[Documents] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch documents',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Download specific document
router.get('/documents/:id/download', authenticateToken, requireRole(['manager', 'admin', 'cd']), async (req: AuthRequest, res) => {
    try {
        const documentId = req.params.id;
        console.log(`[Documents] Download request for document ID: ${documentId} by user: ${req.user!.email}`);

        // Get document with permission check
        let query = '';
        let params: any[] = [documentId];

        // Manager specific authorization - ensure they can only access their team's docs
        // The previous manager query for download endpoint:
        // SELECT la.*, lt.Requester FROM leave_attachments la JOIN leave_taken lt ON la.leave_id = lt.LeaveID LEFT JOIN leave_balances lb ON lt.Requester = lb.EmployeeEmail WHERE la.id = ? AND (lb.Manager = ? OR lt.AlternativeApprover = ?) AND lt.Requester != ?
        // This query implicitly includes the permission check.
        // For admin, it's simpler.

        if (normalizeRole(req.user!.role) === 'admin') {
            query = `
                SELECT la.original_name, la.file_type, la.file_data, lt.Requester
                FROM leave_attachments la
                JOIN leave_taken lt ON la.leave_id = lt.LeaveID
                WHERE la.id = ?
            `;
        } else if (normalizeRole(req.user!.role) === 'manager' || normalizeRole(req.user!.role) === 'cd') {
            query = `
                SELECT la.original_name, la.file_type, la.file_data, lt.Requester
                FROM leave_attachments la
                JOIN leave_taken lt ON la.leave_id = lt.LeaveID
                LEFT JOIN leave_balances lb ON lt.Requester = lb.EmployeeEmail
                WHERE la.id = ? AND (lb.Manager = ? OR lt.AlternativeApprover = ?) AND lt.Requester != ?
            `;
            params = [documentId, req.user!.email, req.user!.email, req.user!.email];
        } else {
            return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to download documents.' });
        }


        const documents = await executeQuery(query, params);

        if (documents.length === 0) {
            console.log(`[Documents] Document not found or access denied for ID: ${documentId}`);
            return res.status(404).json({ success: false, message: 'Document not found or access denied' });
        }

        const document = documents[0];
        console.log(`[Documents] Document found: ${document.original_name} (${document.file_type})`);

        // --- IMPORTANT: REVISED TO STREAM BINARY DATA DIRECTLY ---
        res.setHeader('Content-Type', document.file_type); // Set the actual MIME type
        res.setHeader('Content-Disposition', `inline; filename="${document.original_name}"`); // 'inline' for browser display, 'attachment' for forced download
        res.send(document.file_data); // Send the raw Buffer directly

    } catch (error) {
        console.error('[Documents] Error downloading document:', error);
        res.status(500).json({ success: false, message: 'Failed to download document' });
    }
});

export default router;