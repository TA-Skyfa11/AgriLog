"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rateLimit_1 = require("../middleware/rateLimit");
const router = express_1.default.Router();
router.post('/register', authController_1.register);
router.post('/login', rateLimit_1.loginRateLimiter, authController_1.login);
router.post('/verify-mfa', authController_1.verifyMfa);
router.post('/logout', authController_1.logout);
router.post('/forgot-password', authController_1.forgotPassword);
router.post('/reset-password', authController_1.resetPassword);
router.put('/change-password', authMiddleware_1.protect, authController_1.changePassword);
router.get('/login-history', authMiddleware_1.protect, authController_1.getLoginHistory);
// Protected routes (require login)
router.get('/me', authMiddleware_1.protect, authController_1.getMe);
router.put('/change-password', authMiddleware_1.protect, authController_1.changePassword);
router.put('/toggle-admin-reset', authMiddleware_1.protect, authController_1.toggleAdminReset);
exports.default = router;
