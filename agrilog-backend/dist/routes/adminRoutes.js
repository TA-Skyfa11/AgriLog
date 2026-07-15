"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const orderController_1 = require("../controllers/orderController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../models/User");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.use((0, authMiddleware_1.authorize)(User_1.Role.ADMIN));
router.route('/dashboard')
    .get(adminController_1.getDashboardStats);
router.route('/farms')
    .get(adminController_1.getFarms);
router.route('/users')
    .get(adminController_1.getUsers)
    .post(adminController_1.addUser);
router.route('/users/:userId/toggle-lock')
    .put(adminController_1.toggleUserLock);
router.route('/users/:userId')
    .delete(adminController_1.deleteUser);
router.route('/users/:userId/reset-password')
    .put(adminController_1.adminResetPassword);
router.route('/commission')
    .get(adminController_1.getCommissionSetting)
    .put(adminController_1.updateCommissionSetting);
router.route('/orders')
    .get(orderController_1.getAllOrdersAdmin);
exports.default = router;
