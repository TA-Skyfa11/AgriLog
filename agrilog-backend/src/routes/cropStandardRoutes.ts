import express from 'express';
import { getCropStandards } from '../controllers/cropStandardController';

const router = express.Router();

// Public / Protected route để lấy danh mục chuẩn cây trồng từ database
router.get('/', getCropStandards);

export default router;
