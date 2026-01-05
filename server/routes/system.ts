import express from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// In-memory storage for maintenance mode (in production, use database)
let maintenanceMode = false;

// Get maintenance mode status (accessible to all authenticated users)
router.get('/maintenance', authenticateToken, (req: AuthRequest, res) => {
  try {
    res.json({
      success: true,
      maintenanceMode
    });
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance status'
    });
  }
});

// Set maintenance mode (admin only)
router.post('/maintenance', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    const { maintenanceMode: newMode } = req.body;
    
    if (typeof newMode !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'maintenanceMode must be a boolean'
      });
    }

    const previousMode = maintenanceMode;
    maintenanceMode = newMode;

    console.log(`Maintenance mode changed from ${previousMode} to ${maintenanceMode} by ${req.user?.email}`);

    res.json({
      success: true,
      maintenanceMode,
      message: maintenanceMode 
        ? 'Maintenance mode enabled' 
        : 'Maintenance mode disabled'
    });
  } catch (error) {
    console.error('Error setting maintenance status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set maintenance status'
    });
  }
});

export default router;
