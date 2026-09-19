"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rateLimit_1 = require("../middleware/rateLimit");
const validate_1 = require("../middleware/validate");
const authValidation_1 = require("../validations/authValidation");
const router = express_1.default.Router();
router.post('/register', (0, validate_1.validate)(authValidation_1.registerSchema), authController_1.register);
router.post('/login', rateLimit_1.loginRateLimiter, (0, validate_1.validate)(authValidation_1.loginSchema), authController_1.login);
router.post('/verify-mfa', (0, validate_1.validate)(authValidation_1.verifyMfaSchema), authController_1.verifyMfa);
router.post('/logout', authController_1.logout);
router.post('/forgot-password', (0, validate_1.validate)(authValidation_1.forgotPasswordSchema), authController_1.forgotPassword);
router.post('/reset-password', (0, validate_1.validate)(authValidation_1.resetPasswordSchema), authController_1.resetPassword);
router.put('/change-password', authMiddleware_1.protect, (0, validate_1.validate)(authValidation_1.changePasswordSchema), authController_1.changePassword);
router.get('/login-history', authMiddleware_1.protect, authController_1.getLoginHistory);
// Protected routes (require login)
router.get('/me', authMiddleware_1.protect, authController_1.getMe);
router.put('/toggle-admin-reset', authMiddleware_1.protect, authController_1.toggleAdminReset);
exports.default = router;
