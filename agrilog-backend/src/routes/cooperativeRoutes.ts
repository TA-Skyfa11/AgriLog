import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';
import {
  getCooperativeDashboard,
  getComplianceAlerts,
  sendComplianceWarning,
  exportSeasonDossier,
  getCooperativeMembers,
  addCooperativeMember,
  removeCooperativeMember,
  searchFarmers,
  getCooperativeSeasonComparison,
  getCooperativeProfile,
  updateCooperativeProfile,
} from '../controllers/cooperativeController';

const router = express.Router();

router.use(protect);
router.use(authorize(Role.COOPERATIVE, Role.ADMIN));

router.get('/dashboard', getCooperativeDashboard);
router.get('/compliance-alerts', getComplianceAlerts);
router.post('/compliance-alerts/send-warning', sendComplianceWarning);
router.get('/export-season-dossier', exportSeasonDossier);
router.get('/members', getCooperativeMembers);
router.post('/members', addCooperativeMember);
router.delete('/members/:farmProfileId', removeCooperativeMember);
router.get('/search-farmers', searchFarmers);
router.get('/season-comparison', getCooperativeSeasonComparison);
router.get('/profile', getCooperativeProfile);
router.put('/profile', updateCooperativeProfile);

export default router;
