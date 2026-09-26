import express from 'express';
import { getFarms, getUsers, getDashboardStats, addUser, adminResetPassword, toggleUserLock, toggleDevPaymentPermission, deleteUser, getCommissionSetting, updateCommissionSetting } from '../controllers/adminController';
import { getAllOrdersAdmin } from '../controllers/orderController';
import {
  getAllFeaturesAdmin,
  toggleFeatureAdmin,
  updateFeatureAdmin,
  resetFeaturesAdmin,
} from '../controllers/featureController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

router.use(protect);
router.use(authorize(Role.ADMIN));

router.route('/dashboard')
  .get(getDashboardStats);

router.route('/farms')
  .get(getFarms);

router.route('/users')
  .get(getUsers)
  .post(addUser);

router.route('/users/:userId/toggle-lock')
  .put(toggleUserLock);

router.route('/users/:userId/toggle-dev-payment')
  .put(toggleDevPaymentPermission);

router.route('/users/:userId')
  .delete(deleteUser);
  
router.route('/users/:userId/reset-password')
  .put(adminResetPassword);

router.route('/commission')
  .get(getCommissionSetting)
  .put(updateCommissionSetting);

router.route('/orders')
  .get(getAllOrdersAdmin);

router.route('/features')
  .get(getAllFeaturesAdmin);

router.route('/features/:key/toggle')
  .put(toggleFeatureAdmin);

router.route('/features/:key')
  .put(updateFeatureAdmin);

router.route('/features/reset-defaults')
  .post(resetFeaturesAdmin);

export default router;
