import express from 'express';
import { register, login, changePassword, toggleAdminReset, getMe, getLoginHistory, forgotPassword, resetPassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);
router.get('/login-history', protect, getLoginHistory);

// Protected routes (require login)
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/toggle-admin-reset', protect, toggleAdminReset);

export default router;
