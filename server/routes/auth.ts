
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { emailService } from '../services/emailService';
import { AuditService } from '../services/auditService';

const router = express.Router();

// Register new user with enhanced details including gender
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt received:', {
      email: req.body.email,
      name: req.body.name,
      surname: req.body.surname,
      department: req.body.department,
      gender: req.body.gender,
      hasPassword: !!req.body.password
    });

    const { email, password, name, surname, department, gender } = req.body;

    // Validate required fields
    if (!email || !password || !name || !surname || !department || !gender) {
      console.log('Registration failed: Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'All fields (email, password, name, surname, department, gender) are required' 
      });
    }

    // Check if user already exists
    console.log('Checking if user exists for email:', email);
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    console.log('Existing users found:', existingUsers.length);

    if (existingUsers.length > 0) {
      console.log('Registration failed: User already exists');
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Check if department exists, if not create it
    console.log('Checking department:', department);
    const existingDepartments = await executeQuery(
      'SELECT name FROM departments WHERE name = ?',
      [department]
    );
    console.log('Existing departments found:', existingDepartments.length);

    if (existingDepartments.length === 0) {
      console.log(`Department "${department}" doesn't exist, creating it...`);
      try {
        await executeQuery(
          'INSERT INTO departments (name, description, is_active) VALUES (?, ?, TRUE)',
          [department, `${department} department`]
        );
        console.log(`Department "${department}" created successfully`);
      } catch (deptError) {
        console.error('Error creating department:', deptError);
        throw deptError;
      }
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Combine name and surname for full name
    const fullName = `${name} ${surname}`;
    console.log('Full name created:', fullName);

    // Insert new user with enhanced details including gender
    console.log('Inserting new user...');
    const result = await executeQuery(
      `INSERT INTO users (email, name, department, gender, password_hash, hire_date, is_active) 
       VALUES (?, ?, ?, ?, ?, CURDATE(), TRUE)`,
      [email, fullName, department, gender, hashedPassword]
    );
    console.log('User inserted successfully with ID:', result.insertId);

    // Log user creation to audit
    await AuditService.logInsert('users', result.insertId, {
      email,
      name: fullName,
      department,
      gender,
      hire_date: new Date().toISOString().split('T')[0]
    }, email);

    // Create initial leave balance with gender-based maternity allocation and prorated accumulated leave
    const currentYear = new Date().getFullYear();
    const maternityAllocation = gender === 'male' ? 0 : 90;
    
    // Import and use the existing accumulated leave calculation that handles 27th-of-month rule
    const { AccumulatedLeaveCalculations } = require('../src/services/balance/calculations/accumulatedLeaveCalculations');
    
    // Calculate accumulated leave using the proper monthly accrual logic (1.667 on 27th of each month)
    const hireDate = new Date(); // Using current date as hire date
    const hireDateString = hireDate.toISOString().split('T')[0];
    const proratedAccumulatedLeave = AccumulatedLeaveCalculations.calculateAccumulatedLeave(hireDate, undefined, hireDateString);
    
    console.log('Creating leave balance:', {
      maternityAllocation,
      hireDate: hireDate.toISOString().split('T')[0],
      proratedAccumulatedLeave
    });

    try {
      await executeQuery(
        `INSERT INTO leave_balances (
          EmployeeName, EmployeeEmail, Department, start_date, Year, 
          Maternity, AccumulatedLeave
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [fullName, email, department, hireDateString, currentYear, maternityAllocation, proratedAccumulatedLeave]
      );
      console.log('Leave balance created successfully');
    } catch (balanceError) {
      console.error('Error creating leave balance:', balanceError);
      // Don't fail registration if leave balance creation fails
      console.log('Continuing with registration despite leave balance error');
    }

    // Send admin notification about new user registration
    try {
      await emailService.notifyAdminsOfNewUserRegistration(email, fullName, department, gender);
      console.log('Admin notification sent for new user registration:', email);
    } catch (emailError) {
      console.error('Failed to send admin notification for new user:', emailError);
      // Don't fail registration if admin notification fails
    }

    console.log('Registration completed successfully for:', email);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: result.insertId
    });
  } catch (error: any) {
    console.error('Registration error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      stack: error.stack
    });
    
    // Provide more specific error messages
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      console.log('Database foreign key constraint error');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid department selected. Please choose a valid department.' 
      });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('Duplicate entry error');
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('Database table missing error');
      return res.status(500).json({ 
        success: false, 
        message: 'Database configuration error. Please contact support.' 
      });
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log('Database connection error');
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection failed. Please try again later.' 
      });
    }
    
    console.log('Generic registration error, returning 500');
    res.status(500).json({ 
      success: false, 
      message: `Registration failed: ${error.message}` 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user from database
    const users = await executeQuery(
      'SELECT id, email, name, department, role, password_hash FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Password reset request
router.post('/reset-password', async (req, res) => {
  try {
    console.log('Password reset request received');
    const { email } = req.body;

    if (!email) {
      console.log('Password reset failed: No email provided');
      return res.status(400).json({ 
        success: false, 
        message: 'Email address is required' 
      });
    }

    console.log(`Password reset requested for email: ${email}`);

    // Check if user exists
    const users = await executeQuery(
      'SELECT id, email, name FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    console.log(`Found ${users.length} users for email: ${email}`);

    if (users.length === 0) {
      console.log(`No active user found for email: ${email}`);
      // Don't reveal if email exists or not for security
      return res.json({ 
        success: true, 
        message: 'If this email is registered, you will receive a password reset link' 
      });
    }

    const user = users[0];
    console.log(`Password reset request processed for user: ${user.name} (${user.email})`);
    
    // Generate a secure reset token
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'password_reset' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // In a real application, you would store this token in the database
    // For now, we'll include it in the email link
    
    try {
      // Send password reset email using the email service
      await emailService.notifyPasswordReset(user.email, user.name, resetToken);
      console.log(`Password reset email sent successfully to: ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send reset email. Please try again later.' 
      });
    }
    
    res.json({
      success: true,
      message: 'If this email is registered, you will receive a password reset link'
    });
  } catch (error: any) {
    console.error('Password reset error details:', {
      error: error.message,
      stack: error.stack,
      request: req.body
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Password reset request failed. Please try again later.' 
    });
  }
});

// Password reset confirmation endpoint
router.post('/reset-password-confirm', async (req, res) => {
  try {
    console.log('Password reset confirmation received');
    const { token, password } = req.body;

    if (!token || !password) {
      console.log('Password reset confirmation failed: Missing token or password');
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token and new password are required' 
      });
    }

    if (password.length < 6) {
      console.log('Password reset confirmation failed: Password too short');
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Verify and decode the reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      console.log('Token verified successfully for user:', decoded.email);
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    // Verify token type and user exists
    if (decoded.type !== 'password_reset') {
      console.log('Invalid token type:', decoded.type);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reset token' 
      });
    }

    // Check if user still exists and is active
    const users = await executeQuery(
      'SELECT id, email, name FROM users WHERE id = ? AND email = ? AND is_active = TRUE',
      [decoded.userId, decoded.email]
    );

    if (users.length === 0) {
      console.log('User not found or inactive:', decoded.email);
      return res.status(400).json({ 
        success: false, 
        message: 'User not found or account is inactive' 
      });
    }

    const user = users[0];
    console.log('Updating password for user:', user.name);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password in database
    await executeQuery(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, user.id]
    );

    // Log password reset to audit
    await AuditService.logUpdate('users', user.id, 
      { action: 'password_reset_via_email' }, 
      { password_changed_at: new Date().toISOString() }, 
      user.email
    );

    console.log('Password updated successfully for user:', user.email);

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error: any) {
    console.error('Password reset confirmation error:', {
      error: error.message,
      stack: error.stack,
      request: req.body
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Password reset failed. Please try again later.' 
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export default router;
