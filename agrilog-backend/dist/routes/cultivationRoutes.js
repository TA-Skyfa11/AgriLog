"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const cultivationController_1 = require("../controllers/cultivationController");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.get('/', cultivationController_1.getCultivationBoards);
router.post('/', cultivationController_1.createCultivationBoard);
// Specific routes before param :id
router.get('/season-comparison', cultivationController_1.getSeasonComparison);
router.get('/:id', cultivationController_1.getCultivationBoardById);
router.put('/:id', cultivationController_1.updateCultivationBoard);
router.delete('/:id', cultivationController_1.deleteCultivationBoard);
// Season Lifecycle & Safety PHI endpoints
router.put('/:id/lifecycle-status', cultivationController_1.updateSeasonLifecycleStatus);
router.get('/:id/season-summary', cultivationController_1.getSeasonSummary);
router.get('/:id/phi-warning', cultivationController_1.getBoardPhiWarning);
// Entries
router.get('/:boardId/entries', cultivationController_1.getCultivationEntries);
router.post('/:boardId/entries', cultivationController_1.createCultivationEntry);
router.put('/entries/:id', cultivationController_1.updateCultivationEntry);
router.delete('/entries/:id', cultivationController_1.deleteCultivationEntry);
exports.default = router;
