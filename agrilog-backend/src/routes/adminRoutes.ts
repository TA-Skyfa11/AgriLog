import express from 'express';
import { getFarms } from '../controllers/adminController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

router.use(protect);
router.use(authorize(Role.ADMIN));

router.route('/farms')
  .get(getFarms);

export default router;
