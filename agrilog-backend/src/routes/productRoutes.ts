import express from 'express';
import {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getApprovedProducts,
  getProductDetail,
  getPendingProducts,
  getAllProductsAdmin,
  approveProduct,
  rejectProduct,
} from '../controllers/productController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';
import { validate, validateParams } from '../middleware/validate';
import { idParamSchema } from '../validations/commonValidation';
import {
  createProductSchema,
  updateProductSchema,
  rejectProductSchema,
} from '../validations/productValidation';

const router = express.Router();

// Public marketplace for landing page
router.get('/public', getApprovedProducts);

router.use(protect);

// Company CRUD
router.post(
  '/',
  authorize(Role.COMPANY, Role.ADMIN),
  validate(createProductSchema),
  createProduct
);
router.get('/mine', authorize(Role.COMPANY), getMyProducts);
router.put(
  '/:id',
  authorize(Role.COMPANY),
  validateParams(idParamSchema),
  validate(updateProductSchema),
  updateProduct
);
router.delete(
  '/:id',
  authorize(Role.COMPANY),
  validateParams(idParamSchema),
  deleteProduct
);

// Admin moderation
router.get('/pending', authorize(Role.ADMIN), getPendingProducts);
router.get('/all', authorize(Role.ADMIN), getAllProductsAdmin);
router.put(
  '/:id/approve',
  authorize(Role.ADMIN),
  validateParams(idParamSchema),
  approveProduct
);
router.put(
  '/:id/reject',
  authorize(Role.ADMIN),
  validateParams(idParamSchema),
  validate(rejectProductSchema),
  rejectProduct
);

// Farm marketplace (approved products) – allow both FARM and COMPANY to view
router.get('/', authorize(Role.FARM, Role.COMPANY), getApprovedProducts);
router.get(
  '/:id',
  authorize(Role.FARM, Role.COMPANY, Role.ADMIN),
  validateParams(idParamSchema),
  getProductDetail
);

export default router;
