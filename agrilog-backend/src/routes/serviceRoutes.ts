import express from 'express';
import { 
  getServicePackages, 
  createServicePackage, 
  updateServicePackage, 
  deleteServicePackage,
  getTrialPolicy,
  updateTrialPolicy,
} from '../controllers/serviceController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

router.get('/', getServicePackages); // Ai cũng có thể xem danh sách gói
router.get('/trial-policy', getTrialPolicy); // Ai cũng có thể xem chính sách dùng thử

router.use(protect);
router.use(authorize(Role.ADMIN));

router.put('/trial-policy', updateTrialPolicy); // Admin cập nhật chính sách dùng thử
router.post('/', createServicePackage);
router.put('/:id', updateServicePackage);
router.delete('/:id', deleteServicePackage);

export default router;
