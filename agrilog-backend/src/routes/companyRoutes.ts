import express from 'express';
import { getCompanyProfile, updateCompanyProfile } from '../controllers/companyController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

router.use(protect);
router.use(authorize(Role.COMPANY));

router.route('/profile')
  .get(getCompanyProfile)
  .put(updateCompanyProfile);

export default router;
