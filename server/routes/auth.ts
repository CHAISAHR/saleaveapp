import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

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

    // Create initial leave balance with gender-based maternity allocation
    const currentYear = new Date().getFullYear();
    const maternityAllocation = gender === 'male' ? 0 : 90;
    console.log('Creating leave balance with maternity allocation:', maternityAllocation);

    try {
      await executeQuery(
        `INSERT INTO leave_balances (
          EmployeeName, EmployeeEmail, Department, Year, 
          Maternity, AccumulatedLeave
        ) VALUES (?, ?, ?, ?, ?, 0)`,
        [fullName, email, department, currentYear, maternityAllocation]
      );
      console.log('Leave balance created successfully');
    } catch (balanceError) {
      console.error('Error creating leave balance:', balanceError);
      // Don't fail registration if leave balance creation fails
      console.log('Continuing with registration despite leave balance error');
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

    // In a real application, you would:
    // 1. Generate a secure reset token
    // 2. Store it in the database with expiration
    // 3. Send an email with the reset link
    
    const user = users[0];
    console.log(`Password reset request processed for user: ${user.name} (${user.email})`);
    
    // For now, just log that the reset was requested
    // In production, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    
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

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export default router;
