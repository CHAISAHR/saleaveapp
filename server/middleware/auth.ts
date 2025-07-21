
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'employee' | 'manager' | 'admin';
    name: string;
    department: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log(`[Auth] ${req.method} ${req.path} - Authentication check`);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log(`[Auth] ${req.method} ${req.path} - No token provided`);
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    console.log(`[Auth] ${req.method} ${req.path} - Verifying token...`);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    console.log(`[Auth] ${req.method} ${req.path} - Token decoded, userId: ${decoded.userId}`);
    
    // Get user details from database
    const users = await executeQuery(
      'SELECT id, email, name, department, role FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    if (users.length === 0) {
      console.log(`[Auth] ${req.method} ${req.path} - User not found in database for ID: ${decoded.userId}`);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    console.log(`[Auth] ${req.method} ${req.path} - User authenticated: ${users[0].email} (${users[0].role})`);
    req.user = users[0];
    next();
  } catch (error) {
    console.log(`[Auth] ${req.method} ${req.path} - Token verification failed:`, error);
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    next();
  };
};
