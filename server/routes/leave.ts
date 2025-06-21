import express from 'express';
import multer from 'multer';
import { executeQuery } from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { emailService } from '../services/emailService';
import { HolidayService } from '../services/holidayService';

const router = express.Router();

// Extend AuthRequest to include files property
interface AuthRequestWithFiles extends AuthRequest {
  files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Submit leave request with file attachments
router.post('/request', authenticateToken, upload.array('attachments', 10), async (req: AuthRequestWithFiles, res) => {
  try {
    const { title, detail, startDate, endDate, leaveType } = req.body;
    const requester = req.user!.email;
    const files = Array.isArray(req.files) ? req.files : [];

    // Calculate working days excluding holidays
    const workingDays = await HolidayService.calculateWorkingDaysExcludingHolidays(startDate, endDate);

    const result = await executeQuery(
      `INSERT INTO leave_taken (Title, Detail, StartDate, EndDate, LeaveType, Requester, Status, Created, workingDays) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), ?)`,
      [title, detail, startDate, endDate, leaveType, requester, workingDays]
    );

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

    // Get manager email and send notifications
    const managerQuery = await executeQuery(
      'SELECT Manager FROM leave_balances WHERE EmployeeEmail = ? AND Year = ?',
      [requester, new Date().getFullYear()]
    );

    const managerEmail = managerQuery[0]?.Manager || 'admin@company.com';
    
    // Send email notifications
    await emailService.notifyManagerOfLeaveRequest({
      title,
      leaveType,
      startDate,
      endDate,
      workingDays,
      submittedBy: req.user!.name,
      description: detail
    }, managerEmail);

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      leaveId: leaveId,
      workingDays: workingDays
    });
  } catch (error) {
    console.error('Leave request error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit leave request' });
  }
});

// Get leave requests (filtered by role)
router.get('/requests', authenticateToken, async (req: AuthRequest, res) => {
  try {
    let query = '';
    let params: any[] = [];

    if (req.user!.role === 'admin') {
      // Admin can see all requests with attachments
      query = `SELECT lt.LeaveID, lt.Title, lt.Detail, lt.StartDate, lt.EndDate, lt.LeaveType, 
               lt.Requester, lt.Approver, lt.Status, lt.Created, lt.Modified, lt.Modified_By,
               lt.workingDays, COUNT(la.id) as attachment_count
               FROM leave_taken lt 
               LEFT JOIN leave_attachments la ON lt.LeaveID = la.leave_id
               GROUP BY lt.LeaveID ORDER BY lt.Created DESC`;
    } else if (req.user!.role === 'manager') {
      // Manager can see their team's requests with attachments
      query = `SELECT lt.LeaveID, lt.Title, lt.Detail, lt.StartDate, lt.EndDate, lt.LeaveType, 
               lt.Requester, lt.Approver, lt.Status, lt.Created, lt.Modified, lt.Modified_By,
               lt.workingDays, COUNT(la.id) as attachment_count
               FROM leave_taken lt 
               LEFT JOIN leave_attachments la ON lt.LeaveID = la.leave_id
               JOIN leave_balances lb ON lt.Requester = lb.EmployeeEmail 
               WHERE lb.Manager = ? OR lt.Requester = ? 
               GROUP BY lt.LeaveID ORDER BY lt.Created DESC`;
      params = [req.user!.email, req.user!.email];
    } else {
      // Employee can only see their own requests with attachments
      query = `SELECT lt.LeaveID, lt.Title, lt.Detail, lt.StartDate, lt.EndDate, lt.LeaveType, 
               lt.Requester, lt.Approver, lt.Status, lt.Created, lt.Modified, lt.Modified_By,
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

// Update leave request status (manager/admin only)
router.put('/requests/:id/status', authenticateToken, requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, approver } = req.body;

    await executeQuery(
      'UPDATE leave_taken SET Status = ?, Approver = ?, Modified = NOW(), Modified_By = ? WHERE LeaveID = ?',
      [status, approver || req.user!.email, req.user!.email, id]
    );

    // Get leave request details for email notification
    const leaveDetails = await executeQuery(
      'SELECT * FROM leave_taken WHERE LeaveID = ?',
      [id]
    );

    if (leaveDetails.length > 0) {
      const leave = leaveDetails[0];
      
      if (status === 'approved') {
        await emailService.notifyEmployeeOfApproval(leave, req.user!.name);
      } else if (status === 'rejected') {
        await emailService.notifyEmployeeOfRejection(leave, req.user!.name);
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
