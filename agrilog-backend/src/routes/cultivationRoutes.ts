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
  deleteCultivationEntry
} from '../controllers/cultivationController';

const router = express.Router();

router.use(protect);

router.get('/', getCultivationBoards);
router.post('/', createCultivationBoard);
router.get('/:id', getCultivationBoardById);
router.put('/:id', updateCultivationBoard);
router.delete('/:id', deleteCultivationBoard);

router.get('/:boardId/entries', getCultivationEntries);
router.post('/:boardId/entries', createCultivationEntry);
router.put('/entries/:id', updateCultivationEntry);
router.delete('/entries/:id', deleteCultivationEntry);

export default router;
