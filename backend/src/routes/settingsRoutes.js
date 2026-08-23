import { Router } from 'express';
import { getSettings, updateOverdueThreshold, getEmailOutbox } from '../controllers/settingsController.js';
import { authenticateToken, requireRole, requireApproved } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// View system settings (requires verified approved user)
router.get('/', requireApproved, getSettings);

// Update overdue threshold (Admin only)
router.patch('/overdue-threshold', requireApproved, requireRole('admin'), updateOverdueThreshold);

// View simulated/delivered notification outbox for demo & grading inspection (Admin only - prevents resident PII leak)
router.get('/email-outbox', requireApproved, requireRole('admin'), getEmailOutbox);

export default router;
