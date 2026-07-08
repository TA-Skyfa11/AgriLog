import express from 'express';
import { register, login, changePassword, getLoginHistory } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/change-password', protect, changePassword);
router.get('/login-history', protect, getLoginHistory);

export default router;
