import express from 'express';
import { register, login, changePassword, toggleAdminReset, getMe, getLoginHistory, forgotPassword, resetPassword, verifyMfa, logout } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { loginRateLimiter } from '../middleware/rateLimit';

const router = express.Router();

router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.post('/verify-mfa', verifyMfa);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);
router.get('/login-history', protect, getLoginHistory);

// Protected routes (require login)
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/toggle-admin-reset', protect, toggleAdminReset);

export default router;
