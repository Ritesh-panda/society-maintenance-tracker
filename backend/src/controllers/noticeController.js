import db from '../config/db.js';
import { sendImportantNoticeEmail } from '../services/emailService.js';

/**
 * Get all notices (Important pinned notices surface at the top)
 */
export function getNotices(req, res) {
  try {
    const notices = db.prepare(`
      SELECT n.*, u.name as author_name, u.role as author_role
      FROM notices n
      JOIN users u ON n.author_id = u.id
      ORDER BY n.is_important DESC, n.created_at DESC
    `).all();

    return res.json({
      success: true,
      data: {
        notices,
        total: notices.length,
        pinned_count: notices.filter(n => n.is_important === 1).length
      }
    });
  } catch (err) {
    console.error('[Get Notices Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve society notice board circulars.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

/**
 * Create a new notice circular (Admin only) with length checks (L-08, L-09)
 */
export async function createNotice(req, res) {
  try {
    const { title, content, is_important } = req.body;

    // Title validation
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Notice title is required (at least 3 characters).'
      });
    }

    if (title.trim().length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Notice title cannot exceed 255 characters.'
      });
    }

    // Content validation
    if (!content || typeof content !== 'string' || content.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Notice content is required (at least 5 characters).'
      });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Notice content cannot exceed 5000 characters.'
      });
    }

    const id = 'ntc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const isPinned = is_important ? 1 : 0;
    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    const insert = db.prepare(`
      INSERT INTO notices (id, author_id, title, content, is_important, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    insert.run(id, req.user.id, cleanTitle, cleanContent, isPinned);

    const createdNotice = db.prepare(`
      SELECT n.*, u.name as author_name, u.role as author_role
      FROM notices n
      JOIN users u ON n.author_id = u.id
      WHERE n.id = ?
    `).get(id);

    // If marked as important, broadcast email to all verified residents asynchronously (I6, O2)
    if (isPinned === 1) {
      const residents = db.prepare("SELECT email, name FROM users WHERE role = 'resident' AND is_approved = 1").all();
      if (residents.length > 0) {
        sendImportantNoticeEmail({
          recipients: residents,
          noticeTitle: cleanTitle,
          noticeContent: cleanContent,
          authorName: req.user.name
        }).catch(err => console.error('[Important Notice Broadcast Error]:', err.message));
      }
    }

    return res.status(201).json({
      success: true,
      message: isPinned 
        ? 'Important circular posted and broadcasted via email to residents!' 
        : 'Notice circular published successfully.',
      data: {
        notice: createdNotice
      }
    });
  } catch (err) {
    console.error('[Create Notice Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to publish notice circular.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

/**
 * Delete a notice circular (Admin only)
 */
export function deleteNotice(req, res) {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM notices WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notice circular not found.'
      });
    }

    return res.json({
      success: true,
      message: 'Notice circular deleted successfully.'
    });
  } catch (err) {
    console.error('[Delete Notice Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notice circular.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
