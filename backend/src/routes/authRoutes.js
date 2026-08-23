import { Router } from 'express';
import { 
  register, 
  login, 
  getMe, 
  getPendingApprovals, 
  approveUser, 
  rejectUser 
} from '../controllers/authController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Authenticated session profile
router.get('/me', authenticateToken, getMe);

// Admin-only approval queue routes
router.get('/pending-approvals', authenticateToken, requireRole('admin'), getPendingApprovals);
router.patch('/users/:id/approve', authenticateToken, requireRole('admin'), approveUser);
router.delete('/users/:id/reject', authenticateToken, requireRole('admin'), rejectUser);

export default router;
