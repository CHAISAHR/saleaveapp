import express from 'express';
import { executeQuery } from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { emailService } from '../services/emailService';

const router = express.Router();

const normalizeRole = (r: string) => (r || '').toLowerCase();

// GET list - admin sees all, manager sees only their team
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = normalizeRole(req.user!.role);
    const me = req.user!.email;

    // Pull active employees who have a contract_expiry_date set
    let sql = `
      SELECT u.email AS user_email, u.name AS user_name, u.department, u.manager_email,
             u.contract_expiry_date, u.is_active,
             cr.id AS renewal_id, cr.status, cr.initiated_by, cr.initiated_at,
             cr.sent_to_hr_by, cr.sent_to_hr_at, cr.completed_by, cr.completed_at,
             cr.last_reminder_sent_at, cr.notes
      FROM users u
      LEFT JOIN contract_renewals cr
        ON cr.user_email = u.email AND cr.contract_expiry_date = u.contract_expiry_date
      WHERE u.is_active = TRUE AND u.contract_expiry_date IS NOT NULL
    `;
    const params: any[] = [];
    if (role === 'manager') {
      sql += ' AND u.manager_email = ?';
      params.push(me);
    } else if (role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    sql += ' ORDER BY u.contract_expiry_date ASC';

    const rows = await executeQuery(sql, params);
    res.json({ success: true, renewals: rows });
  } catch (err) {
    console.error('List contract renewals error:', err);
    res.status(500).json({ success: false, message: 'Failed to list contract renewals' });
  }
});

// Helper to upsert renewal row
async function ensureRenewalRow(userEmail: string, expiryDate: string, managerEmail: string | null) {
  const existing = await executeQuery(
    'SELECT id FROM contract_renewals WHERE user_email = ? AND contract_expiry_date = ?',
    [userEmail, expiryDate]
  );
  if (existing.length > 0) return existing[0].id;
  const result: any = await executeQuery(
    `INSERT INTO contract_renewals (user_email, manager_email, contract_expiry_date, status)
     VALUES (?, ?, ?, 'Initiated')`,
    [userEmail, managerEmail, expiryDate]
  );
  return result.insertId;
}

// Initiate (manager or admin)
router.post('/initiate', authenticateToken, requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { user_email } = req.body;
    const users = await executeQuery(
      'SELECT email, manager_email, contract_expiry_date FROM users WHERE email = ? AND is_active = TRUE',
      [user_email]
    );
    if (users.length === 0 || !users[0].contract_expiry_date) {
      return res.status(400).json({ success: false, message: 'User not found or no contract expiry date' });
    }
    const u = users[0];
    if (normalizeRole(req.user!.role) === 'manager' && u.manager_email !== req.user!.email) {
      return res.status(403).json({ success: false, message: 'Not your team member' });
    }
    const expiryDate = new Date(u.contract_expiry_date).toISOString().split('T')[0];
    const id = await ensureRenewalRow(u.email, expiryDate, u.manager_email);
    await executeQuery(
      `UPDATE contract_renewals
       SET status = 'Initiated', initiated_by = ?, initiated_at = NOW()
       WHERE id = ? AND status = 'Initiated'`,
      [req.user!.email, id]
    );
    res.json({ success: true, id });
  } catch (err) {
    console.error('Initiate renewal error:', err);
    res.status(500).json({ success: false, message: 'Failed to initiate renewal' });
  }
});


// Advance status: manager => 'Sent to HR'; admin => 'Completed'
router.patch('/:id/status', authenticateToken, requireRole(['manager', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const role = normalizeRole(req.user!.role);

    const rows = await executeQuery(
      `SELECT cr.*, u.manager_email FROM contract_renewals cr
       LEFT JOIN users u ON u.email = cr.user_email
       WHERE cr.id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Renewal not found' });
    const r = rows[0];

    if (status === 'Sent to HR') {
      if (role === 'manager' && r.manager_email !== req.user!.email) {
        return res.status(403).json({ success: false, message: 'Not your team member' });
      }
      await executeQuery(
        `UPDATE contract_renewals
         SET status = 'Sent to HR', sent_to_hr_by = ?, sent_to_hr_at = NOW(),
             notes = COALESCE(?, notes)
         WHERE id = ?`,
        [req.user!.email, notes || null, id]
      );
    } else if (status === 'Completed') {
      if (role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only admin can complete' });
      }
      await executeQuery(
        `UPDATE contract_renewals
         SET status = 'Completed', completed_by = ?, completed_at = NOW(),
             notes = COALESCE(?, notes)
         WHERE id = ?`,
        [req.user!.email, notes || null, id]
      );
    } else if (status === 'Initiated') {
      await executeQuery(
        `UPDATE contract_renewals SET status = 'Initiated', notes = COALESCE(?, notes) WHERE id = ?`,
        [notes || null, id]
      );
    } else {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Update renewal status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// Send reminders for contracts expiring within 60 days. Admin can trigger manually; cron also calls this.
export async function runReminderJob(triggeredBy = 'system') {
  console.log(`[ContractRenewals] Reminder job started by ${triggeredBy}`);
  // Active users with expiry date in [today, today + 60 days]
  const users = await executeQuery(
    `SELECT email, name, department, manager_email, contract_expiry_date
     FROM users
     WHERE is_active = TRUE
       AND contract_expiry_date IS NOT NULL
       AND contract_expiry_date >= CURDATE()
       AND contract_expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)`,
    []
  );

  // HR & Operations recipients (CC)
  const hrRows = await executeQuery(
    `SELECT email FROM users WHERE department = 'HR & Operations' AND is_active = TRUE`,
    []
  );
  const hrEmails = hrRows.map((r: any) => r.email).filter(Boolean);

  let sent = 0;
  for (const u of users) {
    try {
      const expiryDate = new Date(u.contract_expiry_date).toISOString().split('T')[0];
      const id = await ensureRenewalRow(u.email, expiryDate, u.manager_email);

      // Skip if reminder already sent in the last 7 days
      const recent = await executeQuery(
        `SELECT id FROM contract_renewals
         WHERE id = ? AND last_reminder_sent_at IS NOT NULL
           AND last_reminder_sent_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [id]
      );
      if (recent.length > 0) continue;

      if (!u.manager_email) {
        console.warn(`[ContractRenewals] No manager for ${u.email}, skipping reminder`);
        continue;
      }

      await emailService.notifyManagerOfContractExpiry({
        managerEmail: u.manager_email,
        ccEmails: hrEmails,
        employeeName: u.name,
        employeeEmail: u.email,
        department: u.department,
        expiryDate,
      });

      await executeQuery(
        `UPDATE contract_renewals SET last_reminder_sent_at = NOW(), initiated_at = COALESCE(initiated_at, NOW())
         WHERE id = ?`,
        [id]
      );
      sent++;
    } catch (e) {
      console.error(`[ContractRenewals] Failed reminder for ${u.email}:`, e);
    }
  }
  console.log(`[ContractRenewals] Reminder job complete. Sent ${sent} reminder(s) for ${users.length} expiring contract(s).`);
  return { totalExpiring: users.length, sent };
}


router.post('/send-reminders', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const result = await runReminderJob(req.user!.email);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Send reminders error:', err);
    res.status(500).json({ success: false, message: 'Failed to send reminders' });
  }
});

export default router;
