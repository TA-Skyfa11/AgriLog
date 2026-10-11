import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getDashboardSummary } from '../controllers/dashboardController';

const router = express.Router();

router.use(protect);

router.get('/summary', getDashboardSummary);

export default router;
