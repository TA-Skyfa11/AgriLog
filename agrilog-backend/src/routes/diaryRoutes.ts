import express from 'express';
import { getDiaryEntries, createDiaryEntry } from '../controllers/diaryController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';

const router = express.Router({ mergeParams: true }); // Important to access boardId from parent router

router.use(protect);
router.use(authorize(Role.FARM));

router.route('/')
  .get(getDiaryEntries)
  .post(createDiaryEntry);

export default router;
