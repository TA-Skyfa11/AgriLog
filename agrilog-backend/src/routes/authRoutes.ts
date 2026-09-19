import express from 'express';
import {
  register,
  login,
  changePassword,
  toggleAdminReset,
  getMe,
  getLoginHistory,
  forgotPassword,
  resetPassword,
  verifyMfa,
  logout,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { loginRateLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  verifyMfaSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validations/authValidation';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', loginRateLimiter, validate(loginSchema), login);
router.post('/verify-mfa', validate(verifyMfaSchema), verifyMfa);
router.post('/logout', logout);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.put('/change-password', protect, validate(changePasswordSchema), changePassword);
router.get('/login-history', protect, getLoginHistory);

// Protected routes (require login)
router.get('/me', protect, getMe);
router.put('/toggle-admin-reset', protect, toggleAdminReset);

export default router;
