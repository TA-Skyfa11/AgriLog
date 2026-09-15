import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';
import {
  exportCultivationPdf,
  exportFertilizerPdf,
  exportPesticidePdf,
  exportReportsPdf,
} from '../controllers/exportController';

const router = express.Router();

// All PDF export endpoints require authentication and FARM role
router.use(protect);
router.use(authorize(Role.FARM));

router.get('/pdf/cultivation/:boardId', exportCultivationPdf);
router.get('/pdf/fertilizer/:boardId', exportFertilizerPdf);
router.get('/pdf/pesticide/:boardId', exportPesticidePdf);
router.get('/pdf/reports', exportReportsPdf);

export default router;
