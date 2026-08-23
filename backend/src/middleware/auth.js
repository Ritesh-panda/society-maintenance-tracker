import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing. Server refusing to start without a cryptographically secure key.');
  process.exit(1);
}

/**
 * Authentication Middleware: Validates Bearer JWT Token and loads fresh user from database
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    
    // Fetch live user from DB on every request (ensures instant approval reflection - B5)
    const user = db.prepare('SELECT id, name, email, role, flat_number, phone, is_approved FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: User no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: err.message
    });
  }
}

/**
 * Role-Based Access Control (RBAC) Guard Middleware
 * @param  {...string} allowedRoles Allowed user roles (e.g. 'admin', 'resident')
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] roles. Your role is '${req.user.role}'.`
      });
    }

    next();
  };
}

/**
 * Enforce Approved Account Guard (B2, B3, B4)
 */
export function requireApproved(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  // Admins are always approved; residents must have is_approved === 1
  if (req.user.role === 'resident' && req.user.is_approved === 0) {
    return res.status(403).json({
      success: false,
      message: 'Access restricted: Your apartment registration is pending approval by the RWA Secretary.'
    });
  }

  next();
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d', algorithm: 'HS256' }
  );
}
