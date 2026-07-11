"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = require("../controllers/productController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../models/User");
const router = express_1.default.Router();
// Public marketplace for landing page
router.get('/public', productController_1.getApprovedProducts);
router.use(authMiddleware_1.protect);
// Company CRUD
router.post('/', (0, authMiddleware_1.authorize)(User_1.Role.COMPANY, User_1.Role.ADMIN), productController_1.createProduct);
router.get('/mine', (0, authMiddleware_1.authorize)(User_1.Role.COMPANY), productController_1.getMyProducts);
router.put('/:id', (0, authMiddleware_1.authorize)(User_1.Role.COMPANY), productController_1.updateProduct);
router.delete('/:id', (0, authMiddleware_1.authorize)(User_1.Role.COMPANY), productController_1.deleteProduct);
// Admin moderation
router.get('/pending', (0, authMiddleware_1.authorize)(User_1.Role.ADMIN), productController_1.getPendingProducts);
router.get('/all', (0, authMiddleware_1.authorize)(User_1.Role.ADMIN), productController_1.getAllProductsAdmin);
router.put('/:id/approve', (0, authMiddleware_1.authorize)(User_1.Role.ADMIN), productController_1.approveProduct);
router.put('/:id/reject', (0, authMiddleware_1.authorize)(User_1.Role.ADMIN), productController_1.rejectProduct);
// Farm marketplace (approved products) – allow both FARM and COMPANY to view
router.get('/', (0, authMiddleware_1.authorize)(User_1.Role.FARM, User_1.Role.COMPANY), productController_1.getApprovedProducts);
router.get('/:id', (0, authMiddleware_1.authorize)(User_1.Role.FARM, User_1.Role.COMPANY, User_1.Role.ADMIN), productController_1.getProductDetail);
exports.default = router;
