"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const serviceController_1 = require("../controllers/serviceController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../models/User");
const router = express_1.default.Router();
router.get('/', serviceController_1.getServicePackages); // Ai cũng có thể xem danh sách gói
router.use(authMiddleware_1.protect);
router.use((0, authMiddleware_1.authorize)(User_1.Role.ADMIN));
router.post('/', serviceController_1.createServicePackage);
router.put('/:id', serviceController_1.updateServicePackage);
router.delete('/:id', serviceController_1.deleteServicePackage);
exports.default = router;
