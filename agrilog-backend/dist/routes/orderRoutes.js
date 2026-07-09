"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderController_1 = require("../controllers/orderController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../models/User");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
// Farm
router.post('/', (0, authMiddleware_1.authorize)(User_1.Role.FARM), orderController_1.createOrder);
router.get('/mine', (0, authMiddleware_1.authorize)(User_1.Role.FARM), orderController_1.getMyOrders);
// Company
router.get('/company', (0, authMiddleware_1.authorize)(User_1.Role.COMPANY), orderController_1.getCompanyOrders);
router.get('/company/stats', (0, authMiddleware_1.authorize)(User_1.Role.COMPANY), orderController_1.getCompanyStats);
router.put('/:id/status', (0, authMiddleware_1.authorize)(User_1.Role.COMPANY), orderController_1.updateOrderStatus);
exports.default = router;
