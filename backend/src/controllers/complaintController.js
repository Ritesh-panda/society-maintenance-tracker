import fs from 'fs';
import db from '../config/db.js';
import { enrichAndSortComplaints, enrichWithOverdueStatus, getOverdueThresholdDays } from '../services/overdueService.js';
import { sendComplaintStatusEmail } from '../services/emailService.js';

const ALLOWED_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Security',
  'Common Area',
  'Cleanliness',
  'Lift / Elevator',
  'Other'
];

const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High'];
const ALLOWED_STATUSES = ['Open', 'In Progress', 'Resolved'];

/**
 * Create a new complaint (Resident) with strict field validation (L-04) and safe file handling
 */
export async function createComplaint(req, res) {
  try {
    const { title, description, category, priority } = req.body;
    const resident_id = req.user.id;

    // 1. Title validation
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      if (req.file && fs.existsSync(req.file.path)) try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({
        success: false,
        message: 'Complaint title is required and must be at least 3 characters.'
      });
    }

    if (title.trim().length > 200) {
      if (req.file && fs.existsSync(req.file.path)) try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({
        success: false,
        message: 'Complaint title cannot exceed 200 characters.'
      });
    }

    // 2. Description validation
    if (!description || typeof description !== 'string' || description.trim().length < 5) {
      if (req.file && fs.existsSync(req.file.path)) try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({
        success: false,
        message: 'Detailed description is required (at least 5 characters).'
      });
    }

    if (description.trim().length > 3000) {
      if (req.file && fs.existsSync(req.file.path)) try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 3000 characters.'
      });
    }

    // 3. Category validation (Whitelist check)
    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      if (req.file && fs.existsSync(req.file.path)) try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: [${ALLOWED_CATEGORIES.join(', ')}].`
      });
    }

    // 4. Priority validation (Whitelist check, default to Medium)
    const assignedPriority = (priority && ALLOWED_PRIORITIES.includes(priority)) ? priority : 'Medium';

    const complaintId = 'cmp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const historyId = 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    
    let photo_url = null;
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const insertComplaint = db.prepare(`
      INSERT INTO complaints (id, resident_id, title, description, category, priority, status, photo_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'Open', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const insertHistory = db.prepare(`
      INSERT INTO complaint_history (id, complaint_id, actor_id, actor_name, actor_role, previous_status, new_status, previous_priority, new_priority, note, created_at)
      VALUES (?, ?, ?, ?, ?, NULL, 'Open', NULL, ?, 'Complaint lodged by resident via portal', CURRENT_TIMESTAMP)
    `);

    const createTx = db.transaction(() => {
      insertComplaint.run(complaintId, resident_id, title.trim(), description.trim(), category, assignedPriority, photo_url);
      insertHistory.run(historyId, complaintId, req.user.id, req.user.name, req.user.role, assignedPriority);
    });
    createTx();

    const createdComplaint = db.prepare(`
      SELECT c.*, u.name as resident_name, u.email as resident_email, u.flat_number as resident_flat, u.phone as resident_phone
      FROM complaints c
      JOIN users u ON c.resident_id = u.id
      WHERE c.id = ?
    `).get(complaintId);

    const enriched = enrichWithOverdueStatus(createdComplaint);

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully to society administration.',
      data: {
        complaint: enriched
      }
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('[Upload Cleanup Error]:', unlinkErr);
      }
    }
    console.error('[Create Complaint Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to lodge complaint.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

/**
 * List complaints with sanitized wildcard queries (L-07), overdue sorting & optional pagination
 */
export function getComplaints(req, res) {
  try {
    const { status, category, priority, search, from_date, to_date, limit, offset } = req.query;
    let query = `
      SELECT c.*, u.name as resident_name, u.email as resident_email, u.flat_number as resident_flat, u.phone as resident_phone
      FROM complaints c
      JOIN users u ON c.resident_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Resident access constraint: residents can ONLY query their own complaints
    if (req.user.role === 'resident') {
      query += ' AND c.resident_id = ?';
      params.push(req.user.id);
    }

    // Filter by status
    if (status && status !== 'all' && ALLOWED_STATUSES.includes(status)) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    // Filter by category
    if (category && category !== 'all' && ALLOWED_CATEGORIES.includes(category)) {
      query += ' AND c.category = ?';
      params.push(category);
    }

    // Filter by priority
    if (priority && priority !== 'all' && ALLOWED_PRIORITIES.includes(priority)) {
      query += ' AND c.priority = ?';
      params.push(priority);
    }

    // Filter by Date Range (inclusive)
    if (from_date && /^\d{4}-\d{2}-\d{2}$/.test(from_date)) {
      query += ' AND DATE(c.created_at) >= DATE(?)';
      params.push(from_date);
    }
    if (to_date && /^\d{4}-\d{2}-\d{2}$/.test(to_date)) {
      query += ' AND DATE(c.created_at) <= DATE(?)';
      params.push(to_date);
    }

    // Sanitize wildcard search characters
    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = search.trim().replace(/[%_]/g, '\\$&');
      query += ' AND (c.title LIKE ? OR c.description LIKE ? OR u.name LIKE ? OR u.flat_number LIKE ?)';
      const s = `%${sanitized}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY c.created_at DESC';

    const complaints = db.prepare(query).all(...params);
    const sortedEnriched = enrichAndSortComplaints(complaints);

    // Optional limit/offset pagination
    let paginated = sortedEnriched;
    if (limit !== undefined) {
      const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
      const o = Math.max(0, parseInt(offset, 10) || 0);
      paginated = sortedEnriched.slice(o, o + l);
    }

    return res.json({
      success: true,
      data: {
        complaints: paginated,
        total: sortedEnriched.length,
        returned: paginated.length,
        overdue_count: sortedEnriched.filter(c => c.is_overdue).length
      }
    });
  } catch (err) {
    console.error('[Get Complaints Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

/**
 * Get complaint details with full timeline and ownership checks
 */
export function getComplaintById(req, res) {
  try {
    const { id } = req.params;
    const complaint = db.prepare(`
      SELECT c.*, u.name as resident_name, u.email as resident_email, u.flat_number as resident_flat, u.phone as resident_phone
      FROM complaints c
      JOIN users u ON c.resident_id = u.id
      WHERE c.id = ?
    `).get(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found.'
      });
    }

    // Role-based scoping: Resident can only view their own complaint details
    if (req.user.role === 'resident' && complaint.resident_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view other residents\' complaints.'
      });
    }

    const history = db.prepare(`
      SELECT * FROM complaint_history
      WHERE complaint_id = ?
      ORDER BY created_at ASC
    `).all(id);

    const enriched = enrichWithOverdueStatus(complaint);

    return res.json({
      success: true,
      data: {
        complaint: enriched,
        history
      }
    });
  } catch (err) {
    console.error('[Get Complaint By ID Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaint details.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

/**
 * Update complaint status & priority (Admin Only) with atomic history tracking (L-02)
 */
export async function updateComplaintStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, priority, note } = req.body;

    const existing = db.prepare(`
      SELECT c.*, u.name as resident_name, u.email as resident_email, u.flat_number as resident_flat
      FROM complaints c
      JOIN users u ON c.resident_id = u.id
      WHERE c.id = ?
    `).get(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found.'
      });
    }

    // Status validation
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: [${ALLOWED_STATUSES.join(', ')}].`
      });
    }

    // Priority validation
    if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Must be one of: [${ALLOWED_PRIORITIES.join(', ')}].`
      });
    }

    const newStatus = status || existing.status;
    const newPriority = priority || existing.priority;
    const cleanNote = (note && typeof note === 'string') ? note.trim() : null;

    // Check if any actual change occurred
    if (newStatus === existing.status && newPriority === existing.priority && !cleanNote) {
      return res.status(400).json({
        success: false,
        message: 'No changes provided for status, priority, or remarks note.'
      });
    }

    const historyId = 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    let resolvedAtValue = existing.resolved_at;
    if (newStatus === 'Resolved' && existing.status !== 'Resolved') {
      resolvedAtValue = new Date().toISOString();
    } else if (newStatus !== 'Resolved' && existing.status === 'Resolved') {
      resolvedAtValue = null; // Reopened complaint
    }

    const updateComplaintStmt = db.prepare(`
      UPDATE complaints
      SET status = ?, priority = ?, resolved_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const insertHistoryStmt = db.prepare(`
      INSERT INTO complaint_history (id, complaint_id, actor_id, actor_name, actor_role, previous_status, new_status, previous_priority, new_priority, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    // Atomic execution with better-sqlite3 transaction
    const updateTx = db.transaction(() => {
      updateComplaintStmt.run(newStatus, newPriority, resolvedAtValue, id);
      insertHistoryStmt.run(
        historyId,
        id,
        req.user.id,
        req.user.name,
        req.user.role,
        existing.status,
        newStatus,
        existing.priority,
        newPriority,
        cleanNote
      );
    });
    updateTx();

    const updatedComplaint = db.prepare(`
      SELECT c.*, u.name as resident_name, u.email as resident_email, u.flat_number as resident_flat, u.phone as resident_phone
      FROM complaints c
      JOIN users u ON c.resident_id = u.id
      WHERE c.id = ?
    `).get(id);

    const enriched = enrichWithOverdueStatus(updatedComplaint);

    // Asynchronous email notification dispatch to resident
    sendComplaintStatusEmail({
      residentEmail: existing.resident_email,
      residentName: existing.resident_name,
      complaintId: id,
      complaintTitle: existing.title,
      oldStatus: existing.status,
      newStatus: newStatus,
      note: cleanNote
    }).catch(emailErr => {
      console.warn('[Status Update Email Dispatch Warning]:', emailErr.message);
    });

    return res.json({
      success: true,
      message: `Complaint #${id.replace('cmp_', 'CMP-')} updated successfully to '${newStatus}'.`,
      data: {
        complaint: enriched
      }
    });
  } catch (err) {
    console.error('[Update Complaint Status Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update complaint status.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

/**
 * ADMIN: Executive Dashboard Metrics and SLA Breakdown
 */
export function getDashboardStats(req, res) {
  try {
    const allComplaints = db.prepare(`
      SELECT c.*, u.name as resident_name, u.flat_number as resident_flat
      FROM complaints c
      JOIN users u ON c.resident_id = u.id
    `).all();

    const enriched = enrichAndSortComplaints(allComplaints);

    const summary = {
      total: enriched.length,
      open: enriched.filter(c => c.status === 'Open').length,
      in_progress: enriched.filter(c => c.status === 'In Progress').length,
      resolved: enriched.filter(c => c.status === 'Resolved').length,
      overdue: enriched.filter(c => c.is_overdue).length,
      overdue_threshold_days: getOverdueThresholdDays()
    };

    // Category breakdown
    const byCategory = {};
    for (const cat of ALLOWED_CATEGORIES) {
      byCategory[cat] = enriched.filter(c => c.category === cat).length;
    }

    // Priority breakdown
    const byPriority = {
      High: enriched.filter(c => c.priority === 'High').length,
      Medium: enriched.filter(c => c.priority === 'Medium').length,
      Low: enriched.filter(c => c.priority === 'Low').length
    };

    return res.json({
      success: true,
      data: {
        summary,
        by_category: byCategory,
        by_priority: byPriority,
        recent_complaints: enriched.slice(0, 10)
      }
    });
  } catch (err) {
    console.error('[Get Dashboard Stats Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute dashboard metrics.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
