import express from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = express.Router();

// Get recent audit activity (admin only)
router.get('/recent', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const activity = await AuditService.getRecentActivity(limit);
    
    res.json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Error fetching recent audit activity:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit activity' });
  }
});

// Get audit history for a specific table (admin only)
router.get('/table/:tableName', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { tableName } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const history = await AuditService.getTableHistory(tableName, limit);
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching table audit history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch table audit history' });
  }
});

// Get audit history for a specific record (admin only)
router.get('/record/:tableName/:recordId', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { tableName, recordId } = req.params;
    
    const history = await AuditService.getRecordHistory(tableName, recordId);
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching record audit history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch record audit history' });
  }
});

export default router;