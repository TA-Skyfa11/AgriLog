"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const materialController_1 = require("../controllers/materialController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../models/User");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.use((0, authMiddleware_1.authorize)(User_1.Role.FARM));
router.route('/')
    .get(materialController_1.getInventory)
    .post(materialController_1.importMaterial);
router.route('/logs')
    .get(materialController_1.getMaterialLogs);
exports.default = router;
