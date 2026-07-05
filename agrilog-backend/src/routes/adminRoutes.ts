import express from 'express';
import { getFarms, getDashboardStats } from '../controllers/adminController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

router.use(protect);
router.use(authorize(Role.ADMIN));

router.route('/dashboard')
  .get(getDashboardStats);

router.route('/farms')
  .get(getFarms);

export default router;
