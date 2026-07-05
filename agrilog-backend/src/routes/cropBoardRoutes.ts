import express from 'express';
import { getCropBoards, createCropBoard, getCropBoardById } from '../controllers/cropBoardController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';
import diaryRoutes from './diaryRoutes';

const router = express.Router();

router.use(protect);
router.use(authorize(Role.FARM));

// Mount diary routes
router.use('/:boardId/diary', diaryRoutes);

router.route('/')
  .get(getCropBoards)
  .post(createCropBoard);

router.route('/:id')
  .get(getCropBoardById);

export default router;
