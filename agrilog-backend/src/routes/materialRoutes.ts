import express from 'express';
import { getInventory, importMaterial, getMaterialLogs, updateMaterial, deleteMaterial } from '../controllers/materialController';
import { protect, authorize } from '../middleware/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

router.use(protect);
router.use(authorize(Role.FARM));

router.route('/')
  .get(getInventory)
  .post(importMaterial);

router.route('/:id')
  .put(updateMaterial)
  .delete(deleteMaterial);

router.route('/logs')
  .get(getMaterialLogs);

export default router;
