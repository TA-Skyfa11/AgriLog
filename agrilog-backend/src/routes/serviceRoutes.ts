import express from 'express';
import { getServicePackages, createServicePackage, updateServicePackage, deleteServicePackage } from '../controllers/serviceController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

router.get('/', getServicePackages); // Ai cũng có thể xem danh sách gói

router.use(protect);
router.use(authorize(Role.ADMIN));

router.post('/', createServicePackage);
router.put('/:id', updateServicePackage);
router.delete('/:id', deleteServicePackage);

export default router;
