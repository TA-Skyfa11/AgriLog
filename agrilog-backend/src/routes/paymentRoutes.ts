import express from 'express';
import {
  createPayment,
  getPaymentStatus,
  sepayWebhook,
  simulatePaymentSuccess,
  getUserPaymentHistory,
  issueOAuthToken,
} from '../controllers/paymentController';
import { protect } from '../middleware/authMiddleware';
import {
  verifyPaymentWebhookAuth,
  protectDevSimulate,
} from '../middleware/paymentSecurityMiddleware';

const router = express.Router();

// 1. OAuth 2.0 Token Endpoint (RFC 6749 Client Credentials Grant)
router.post('/oauth/token', issueOAuthToken);

// 2. Webhook tiếp nhận từ SePay (Bảo vệ bởi API Key, HMAC-SHA256, hoặc OAuth 2.0 Bearer Token)
router.post('/sepay-webhook', verifyPaymentWebhookAuth, sepayWebhook);

// 3. Tra cứu trạng thái giao dịch theo paymentCode (hỗ trợ polling cả ở Billing và Register)
router.get('/status/:paymentCode', getPaymentStatus);

// 4. Mô phỏng thanh toán thành công (Bảo vệ: Chỉ khả dụng ở môi trường Dev hoặc tài khoản Admin)
router.post('/dev-simulate', protectDevSimulate, simulatePaymentSuccess);

// 5. Các endpoint yêu cầu đăng nhập
router.use(protect);
router.post('/create', createPayment);
router.get('/history', getUserPaymentHistory);

export default router;
