
import express from 'express';
import { executeQuery } from '../config/database';

const router = express.Router();

// Get all active departments
router.get('/', async (req, res) => {
  try {
    // Since there might not be a departments table yet, return default departments
    const defaultDepartments = [
        { id: 1, name: 'HR & Operations', description: 'HR department managing personnel and policies', is_active: true},
        { id: 2, name: 'Access to Medicines', description: 'HIV Access', is_active: true},
        { id: 3, name: 'Finance', description: 'Finance department managing company finances', is_active: true},
        { id: 4, name: 'Assistive Technologies', description: 'Assistive technologies team', is_active: true},
        { id: 5, name: 'SHF', description: 'Health Financing', is_active: true},
        { id: 6, name: 'TB', description: 'TB Access', is_active: true},
        { id: 7, name: 'HIV Prevention', description: 'HIV team', is_active: true},
        { id: 8, name: 'Cancer', description: 'Cervical Cancer', is_active: true},
        { id: 9, name: 'Global', description: 'Global Team', is_active: true},
        { id: 10, name: 'FCDO', description: 'FCDO', is_active: true},
        { id: 11, name: 'Malaria', description: 'Malaria team', is_active: true},
        { id: 12, name: 'SRMNH', description: 'HIV team', is_active: true},
        { id: 13, name: 'Pediatric and Adolescent HIV', description: 'HIV team', is_active: true},
        { id: 14, name: 'Syphilis', description: 'HIV team', is_active: true},
        { id: 15, name: 'Senior Leadership', description: 'Senior Leadership', is_active: true},
        { id: 16, name: 'Other', description: 'Any other team', is_active: true}
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
