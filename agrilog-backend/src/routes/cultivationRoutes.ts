import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getCultivationBoards,
  createCultivationBoard,
  getCultivationBoardById,
  updateCultivationBoard,
  deleteCultivationBoard,
  getCultivationEntries,
  createCultivationEntry,
  updateCultivationEntry,
  deleteCultivationEntry,
  updateSeasonLifecycleStatus,
  getSeasonSummary,
  getSeasonComparison,
  getBoardPhiWarning,
} from '../controllers/cultivationController';

const router = express.Router();

router.use(protect);

router.get('/', getCultivationBoards);
router.post('/', createCultivationBoard);

// Specific routes before param :id
router.get('/season-comparison', getSeasonComparison);

router.get('/:id', getCultivationBoardById);
router.put('/:id', updateCultivationBoard);
router.delete('/:id', deleteCultivationBoard);

// Season Lifecycle & Safety PHI endpoints
router.put('/:id/lifecycle-status', updateSeasonLifecycleStatus);
router.get('/:id/season-summary', getSeasonSummary);
router.get('/:id/phi-warning', getBoardPhiWarning);

// Entries
router.get('/:boardId/entries', getCultivationEntries);
router.post('/:boardId/entries', createCultivationEntry);
router.put('/entries/:id', updateCultivationEntry);
router.delete('/entries/:id', deleteCultivationEntry);

export default router;
