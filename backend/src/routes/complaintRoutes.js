import { Router } from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  getDashboardStats
} from '../controllers/complaintController.js';
import { authenticateToken, requireRole, requireApproved } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Base protection: all complaint routes require valid JWT authentication and approved account status (B2, B4)
router.use(authenticateToken);
router.use(requireApproved);

// Dashboard metrics (Admin only)
router.get('/dashboard/stats', requireRole('admin'), getDashboardStats);

// List complaints (Residents see own, Admins see all with filters & overdue priority)
router.get('/', getComplaints);

// Get single complaint with full history timeline
router.get('/:id', getComplaintById);

// Create new complaint (Residents & Admins)
router.post('/', upload.single('photo'), createComplaint);

// Update complaint status & priority (Admin only)
router.patch('/:id/status', requireRole('admin'), updateComplaintStatus);

export default router;
