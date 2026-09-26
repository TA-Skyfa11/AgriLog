import express from 'express';
import {
  getActiveFeatures,
  getAllFeaturesAdmin,
  toggleFeatureAdmin,
  updateFeatureAdmin,
  resetFeaturesAdmin,
} from '../controllers/featureController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

// 1. Endpoint công khai lấy danh sách tính năng đang hoạt động (cho Frontend)
router.get('/active', getActiveFeatures);

// 2. Các endpoint Quản trị viên quản lý tính năng
router.use(protect);
router.use(authorize(Role.ADMIN));

router.get('/admin', getAllFeaturesAdmin);
router.put('/admin/:key/toggle', toggleFeatureAdmin);
router.put('/admin/:key', updateFeatureAdmin);
router.post('/admin/reset-defaults', resetFeaturesAdmin);

export default router;
