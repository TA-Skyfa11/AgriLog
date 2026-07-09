import express from 'express';
import {
  createProduct, getMyProducts, updateProduct, deleteProduct,
  getApprovedProducts, getProductDetail,
  getPendingProducts, getAllProductsAdmin, approveProduct, rejectProduct
} from '../controllers/productController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

router.use(protect);

// Company CRUD
router.post('/', authorize(Role.COMPANY, Role.ADMIN), createProduct);
router.get('/mine', authorize(Role.COMPANY), getMyProducts);
router.put('/:id', authorize(Role.COMPANY), updateProduct);
router.delete('/:id', authorize(Role.COMPANY), deleteProduct);

// Admin moderation
router.get('/pending', authorize(Role.ADMIN), getPendingProducts);
router.get('/all', authorize(Role.ADMIN), getAllProductsAdmin);
router.put('/:id/approve', authorize(Role.ADMIN), approveProduct);
router.put('/:id/reject', authorize(Role.ADMIN), rejectProduct);

// Farm marketplace (approved products) – allow both FARM and COMPANY to view
router.get('/', authorize(Role.FARM, Role.COMPANY), getApprovedProducts);
router.get('/:id', authorize(Role.FARM, Role.COMPANY, Role.ADMIN), getProductDetail);

export default router;
