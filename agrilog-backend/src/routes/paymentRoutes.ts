import express from 'express';
import {
  createPayment,
  getPaymentStatus,
  sepayWebhook,
  simulatePaymentSuccess,
  getUserPaymentHistory,
} from '../controllers/paymentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// 1. Webhook tiếp nhận từ SePay (Public endpoint cho SePay server gọi đến)
router.post('/sepay-webhook', sepayWebhook);

// 2. Tra cứu trạng thái giao dịch theo paymentCode (hỗ trợ polling cả ở Billing và Register)
router.get('/status/:paymentCode', getPaymentStatus);

// 3. Mô phỏng thanh toán thành công (dành cho môi trường test/dev)
router.post('/dev-simulate', simulatePaymentSuccess);

// 4. Các endpoint yêu cầu đăng nhập
router.use(protect);
router.post('/create', createPayment);
router.get('/history', getUserPaymentHistory);

export default router;
