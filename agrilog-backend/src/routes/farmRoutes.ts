import express from 'express';
import { getFarmProfile, updateFarmProfile } from '../controllers/farmProfileController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

router.use(protect);
router.use(authorize(Role.FARM));

router.route('/profile')
  .get(getFarmProfile)
  .put(updateFarmProfile);

export default router;
