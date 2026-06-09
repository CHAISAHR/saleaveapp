import express from 'express';
import { executeQuery } from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

const DEFAULT_DEPARTMENTS = [
  { name: 'HR & Operations', description: 'HR department managing personnel and policies' },
  { name: 'Access to Medicines', description: 'HIV Access' },
  { name: 'Finance', description: 'Finance department managing company finances' },
  { name: 'Assistive Technologies', description: 'Assistive technologies team' },
  { name: 'SHF', description: 'Health Financing' },
  { name: 'TB', description: 'TB Access' },
  { name: 'HIV Prevention', description: 'HIV team' },
  { name: 'Cancer', description: 'Cervical Cancer' },
  { name: 'Global', description: 'Global Team' },
  { name: 'FCDO', description: 'FCDO' },
  { name: 'Malaria', description: 'Malaria team' },
  { name: 'SRMNH', description: 'HIV team' },
  { name: 'Pediatric and Adolescent HIV', description: 'HIV team' },
  { name: 'Syphilis', description: 'HIV team' },
  { name: 'Senior Leadership', description: 'Senior Leadership' },
  { name: 'Other', description: 'Any other team' },
];

// Ensure departments table exists and is seeded
async function ensureDepartmentsTable() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS departments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const existing = await executeQuery('SELECT COUNT(*) AS c FROM departments');
  if (!existing[0] || existing[0].c === 0) {
    for (const d of DEFAULT_DEPARTMENTS) {
      try {
        await executeQuery(
          'INSERT IGNORE INTO departments (name, description, is_active) VALUES (?, ?, 1)',
          [d.name, d.description]
        );
      } catch (e) {
        console.error('Seed department failed:', d.name, e);
      }
    }
  }
}

// Get all departments
router.get('/', authenticateToken, async (req, res) => {
  try {
    await ensureDepartmentsTable();
    const departments = await executeQuery(
      'SELECT id, name, description, is_active, created_at, updated_at FROM departments ORDER BY name'
    );
    res.json({ success: true, departments });
  } catch (error) {
    console.error('Get departments error:', error);
    // Fallback so the UI still works
    res.json({
      success: true,
      departments: DEFAULT_DEPARTMENTS.map((d, i) => ({
        id: i + 1, name: d.name, description: d.description, is_active: true,
      })),
    });
  }
});

// Create department (admin/cd)
router.post('/', authenticateToken, requireRole(['admin', 'cd']), async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }
    await ensureDepartmentsTable();

    const existing = await executeQuery('SELECT id FROM departments WHERE name = ?', [name.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Department already exists' });
    }

    const result = await executeQuery(
      'INSERT INTO departments (name, description, is_active) VALUES (?, ?, 1)',
      [name.trim(), description || null]
    );
    res.status(201).json({ success: true, message: 'Department added', id: result.insertId });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ success: false, message: 'Failed to add department' });
  }
});

// Update department (admin/cd)
router.put('/:id', authenticateToken, requireRole(['admin', 'cd']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }
    await executeQuery(
      'UPDATE departments SET name = ?, description = ?, is_active = COALESCE(?, is_active), updated_at = NOW() WHERE id = ?',
      [name.trim(), description || null, typeof is_active === 'boolean' ? is_active : null, id]
    );
    res.json({ success: true, message: 'Department updated' });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ success: false, message: 'Failed to update department' });
  }
});

// Delete department (admin/cd)
router.delete('/:id', authenticateToken, requireRole(['admin', 'cd']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM departments WHERE id = ?', [id]);
    res.json({ success: true, message: 'Department deleted' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete department' });
  }
});

export default router;
