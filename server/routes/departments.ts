
import express from 'express';
import { executeQuery } from '../config/database';

const router = express.Router();

// Get all active departments
router.get('/', async (req, res) => {
  try {
    // Since there might not be a departments table yet, return default departments
    const defaultDepartments = [
      { id: 1, name: 'Hr & Ops', is_active: true},
      { id: 2, name: 'Access to Medicines', is_active: true},
      { id: 3, name: 'Finance',is_active: true },
      { id: 4, name: 'Assistive Technologies',is_active: true},
      { id: 5, name: 'SHF',is_active: true},
      { id: 6, name: 'TB',is_active: true},
      { id: 7, name: 'HIV SS, Prep,& SRMNH',is_active: true},
      { id: 8, name: 'Cancer',is_active: true},
      { id: 9, name: 'Global',is_active: true},
      { id: 10, name: 'FCDO',is_active: true},
      { id: 11, name: 'Other',is_active: true}
      ];

    res.json({ 
      success: true, 
      departments: defaultDepartments 
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, message: 'Failed to get departments' });
  }
});

export default router;
