
import express from 'express';
import { executeQuery } from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Submit leave request
router.post('/request', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, detail, startDate, endDate, leaveType, workingDays } = req.body;
    const requester = req.user!.email;

    const result = await executeQuery(
      `INSERT INTO leave_taken (Title, Detail, StartDate, EndDate, LeaveType, Requester, Status, Created) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [title, detail, startDate, endDate, leaveType, requester]
    );

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      leaveId: result.insertId
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
      // Admin can see all requests
      query = `SELECT LeaveID, Title, Detail, StartDate, EndDate, LeaveType, Requester, 
               Approver, Status, Created, Modified, Modified_By FROM leave_taken ORDER BY Created DESC`;
    } else if (req.user!.role === 'manager') {
      // Manager can see their team's requests
      query = `SELECT lt.LeaveID, lt.Title, lt.Detail, lt.StartDate, lt.EndDate, lt.LeaveType, 
               lt.Requester, lt.Approver, lt.Status, lt.Created, lt.Modified, lt.Modified_By 
               FROM leave_taken lt 
               JOIN leave_balances lb ON lt.Requester = lb.EmployeeEmail 
               WHERE lb.Manager = ? OR lt.Requester = ? ORDER BY lt.Created DESC`;
      params = [req.user!.email, req.user!.email];
    } else {
      // Employee can only see their own requests
      query = `SELECT LeaveID, Title, Detail, StartDate, EndDate, LeaveType, Requester, 
               Approver, Status, Created, Modified, Modified_By FROM leave_taken 
               WHERE Requester = ? ORDER BY Created DESC`;
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

    res.json({
      success: true,
      message: 'Leave request status updated successfully'
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update leave request status' });
  }
});

export default router;
