import express from 'express';
import {
  createOrder, getMyOrders,
  getCompanyOrders, updateOrderStatus, getCompanyStats
} from '../controllers/orderController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

router.use(protect);

// Farm
router.post('/', authorize(Role.FARM), createOrder);
router.get('/mine', authorize(Role.FARM), getMyOrders);

// Company
router.get('/company', authorize(Role.COMPANY), getCompanyOrders);
router.get('/company/stats', authorize(Role.COMPANY), getCompanyStats);
router.put('/:id/status', authorize(Role.COMPANY), updateOrderStatus);

export default router;
