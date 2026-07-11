import express from 'express';
import { getFarms, getUsers, getDashboardStats, addUser, adminResetPassword, toggleUserLock, deleteUser, getCommissionSetting, updateCommissionSetting } from '../controllers/adminController';
import { getAllOrdersAdmin } from '../controllers/orderController';
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

router.route('/users/:userId')
  .delete(deleteUser);
  
router.route('/users/:userId/reset-password')
  .put(adminResetPassword);

router.route('/commission')
  .get(getCommissionSetting)
  .put(updateCommissionSetting);

router.route('/orders')
  .get(getAllOrdersAdmin);

export default router;
