import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getFertilizerBoards,
  createFertilizerBoard,
  getFertilizerBoardById,
  updateFertilizerBoard,
  deleteFertilizerBoard,
  getFertilizerEntries,
  createFertilizerEntry,
  updateFertilizerEntry,
  deleteFertilizerEntry
} from '../controllers/fertilizerController';

const router = express.Router();

router.use(protect);

router.get('/', getFertilizerBoards);
router.post('/', createFertilizerBoard);
router.get('/:id', getFertilizerBoardById);
router.put('/:id', updateFertilizerBoard);
router.delete('/:id', deleteFertilizerBoard);

router.get('/:boardId/entries', getFertilizerEntries);
router.post('/:boardId/entries', createFertilizerEntry);
router.put('/entries/:id', updateFertilizerEntry);
router.delete('/entries/:id', deleteFertilizerEntry);

export default router;
