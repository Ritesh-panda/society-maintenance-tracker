import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { generateToken } from '../middleware/auth.js';
import { sendResidentApprovalEmail } from '../services/emailService.js';

// Standard RFC-compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Register a new resident account with verification approval queue
 */
export async function register(req, res) {
  try {
    const { name, email, password, flat_number, phone } = req.body;

    // 1. Required field checks
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full Name is required.'
      });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required.'
      });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // 2. Email format validation
    if (!EMAIL_REGEX.test(normalizedEmail) || normalizedEmail.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address (e.g. resident@domain.com).'
      });
    }

    // 3. Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Password cannot exceed 128 characters.'
      });
    }

    // 4. Check for duplicate account
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // 5. Hash password with bcrypt (10 rounds)
    const password_hash = await bcrypt.hash(password, 10);
    const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const role = 'resident';
    const cleanFlat = (flat_number && typeof flat_number === 'string') ? flat_number.trim() : '';
    const cleanPhone = (phone && typeof phone === 'string') ? phone.trim() : '';
    const is_approved = 0; // Requires RWA Admin Verification

    const insert = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, flat_number, phone, role, is_approved, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    insert.run(id, trimmedName, normalizedEmail, password_hash, cleanFlat, cleanPhone, role, is_approved);

    const userPayload = {
      id,
      name: trimmedName,
      email: normalizedEmail,
      flat_number: cleanFlat,
      phone: cleanPhone,
      role,
      is_approved: 0
    };

    const token = generateToken(userPayload);

    return res.status(201).json({
      success: true,
      message: 'Account registered. Verification is pending with RWA management committee.',
      data: {
        token,
        user: userPayload
      }
    });
  } catch (err) {
    console.error('[Register Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.'
    });
  }
}

/**
 * Login handler with timing-safe password verification
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

    if (!user) {
      // Constant-time dummy hash comparison to prevent timing attacks
      await bcrypt.compare(password, '$2a$10$dummyhashplaceholderforconsistenttiming00000000000000000');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      flat_number: user.flat_number,
      phone: user.phone,
      role: user.role,
      is_approved: user.is_approved ?? 1
    };

    const token = generateToken(userPayload);

    return res.json({
      success: true,
      message: 'Authentication successful.',
      data: {
        token,
        user: userPayload
      }
    });
  } catch (err) {
    console.error('[Login Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
}

/**
 * Get currently authenticated user profile
 */
export function getMe(req, res) {
  try {
    const user = db.prepare('SELECT id, name, email, flat_number, phone, role, is_approved, created_at FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.json({
      success: true,
      data: {
        user: {
          ...user,
          is_approved: user.is_approved ?? 1
        }
      }
    });
  } catch (err) {
    console.error('[GetMe Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.'
    });
  }
}

/**
 * ADMIN: Get list of unapproved pending residents
 */
export function getPendingApprovals(req, res) {
  try {
    const pendingResidents = db.prepare(`
      SELECT id, name, email, flat_number, phone, role, is_approved, created_at
      FROM users
      WHERE is_approved = 0
      ORDER BY created_at DESC
    `).all();

    return res.json({
      success: true,
      data: {
        pending_residents: pendingResidents,
        count: pendingResidents.length
      }
    });
  } catch (err) {
    console.error('[Get Pending Approvals Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load pending approvals queue.'
    });
  }
}

/**
 * ADMIN: Approve resident and dispatch welcome verification email
 */
export async function approveUser(req, res) {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    if (user.is_approved === 1) {
      return res.json({
        success: true,
        message: 'User account is already approved and active.'
      });
    }

    db.prepare('UPDATE users SET is_approved = 1 WHERE id = ?').run(id);

    // Send confirmation email
    await sendResidentApprovalEmail({
      residentEmail: user.email,
      residentName: user.name,
      flatNumber: user.flat_number || 'Apartment'
    });

    return res.json({
      success: true,
      message: `Apartment registration for ${user.name} (${user.flat_number}) has been approved.`
    });
  } catch (err) {
    console.error('[Approve User Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve user account.'
    });
  }
}

/**
 * ADMIN: Reject and remove fraudulent / spam registration (guards active/approved accounts)
 */
export function rejectUser(req, res) {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // Security guard: Prevent accidental/malicious deletion of already-approved residents or admins
    if (user.is_approved !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject an already-approved account. Only pending unapproved registrations (is_approved = 0) can be rejected.'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot reject administrator accounts.'
      });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    return res.json({
      success: true,
      message: `Registration request for ${user.name} has been rejected and removed.`
    });
  } catch (err) {
    console.error('[Reject User Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject user registration.'
    });
  }
}
