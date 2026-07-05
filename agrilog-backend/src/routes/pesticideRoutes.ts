import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getPesticideBoards,
  createPesticideBoard,
  getPesticideBoardById,
  updatePesticideBoard,
  deletePesticideBoard,
  getPesticideEntries,
  createPesticideEntry,
  deletePesticideEntry
} from '../controllers/pesticideController';

const router = express.Router();

router.use(protect);

router.get('/', getPesticideBoards);
router.post('/', createPesticideBoard);
router.get('/:id', getPesticideBoardById);
router.put('/:id', updatePesticideBoard);
router.delete('/:id', deletePesticideBoard);

router.get('/:boardId/entries', getPesticideEntries);
router.post('/:boardId/entries', createPesticideEntry);
router.delete('/entries/:id', deletePesticideEntry);

export default router;
