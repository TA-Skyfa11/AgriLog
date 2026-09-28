import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  testOneSignalNotification,
  triggerTaskReminders,
} from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);
router.post('/test-onesignal', testOneSignalNotification);
router.post('/remind-tasks', triggerTaskReminders);

export default router;

