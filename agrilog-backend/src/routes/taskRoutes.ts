import express from 'express';
import { getTasks, createTask, updateTask, deleteTask, completeTask } from '../controllers/taskController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

router.use(protect);
router.use(authorize(Role.FARM));

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

router.route('/:id/complete')
  .put(completeTask);

export default router;
