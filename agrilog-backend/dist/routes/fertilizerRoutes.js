"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const fertilizerController_1 = require("../controllers/fertilizerController");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.get('/', fertilizerController_1.getFertilizerBoards);
router.post('/', fertilizerController_1.createFertilizerBoard);
router.get('/:id', fertilizerController_1.getFertilizerBoardById);
router.put('/:id', fertilizerController_1.updateFertilizerBoard);
router.delete('/:id', fertilizerController_1.deleteFertilizerBoard);
router.get('/:boardId/entries', fertilizerController_1.getFertilizerEntries);
router.post('/:boardId/entries', fertilizerController_1.createFertilizerEntry);
router.delete('/entries/:id', fertilizerController_1.deleteFertilizerEntry);
exports.default = router;
