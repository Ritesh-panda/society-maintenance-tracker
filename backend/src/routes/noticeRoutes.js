import { Router } from 'express';
import { getNotices, createNotice, deleteNotice } from '../controllers/noticeController.js';
import { authenticateToken, requireRole, requireApproved } from '../middleware/auth.js';

const router = Router();

// Base protection: all notice routes require authentication and approved account status (B3)
router.use(authenticateToken);
router.use(requireApproved);

// Read notices (Approved Residents & Admins)
router.get('/', getNotices);

// Create notice (Admin only)
router.post('/', requireRole('admin'), createNotice);

// Delete notice (Admin only)
router.delete('/:id', requireRole('admin'), deleteNotice);

export default router;
