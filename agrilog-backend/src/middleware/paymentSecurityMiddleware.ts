import { Request, Response, NextFunction } from 'express';
import {
  timingSafeEqualString,
  verifyHmacSha256,
  verifyReplayAttack,
  verifyOAuthPaymentToken,
} from '../utils/paymentSecurity';
import { Role } from '../models/User';

export interface PaymentAuthRequest extends Request {
  paymentAuth?: {
    method: 'HMAC-SHA256' | 'API_KEY' | 'OAUTH2' | 'DEV_BYPASS';
    authenticated: boolean;
    details?: any;
  };
  user?: any;
}

/**
 * Middleware xác thực Webhook thanh toán SePay / Payment Gateway
 * Hỗ trợ đồng thời 3 cơ chế xác thực:
 * 1. HMAC-SHA256 (Chữ ký điện tử toàn vẹn qua header x-signature / x-sepay-signature)
 * 2. API Key (Timing-safe qua header Authorization / x-api-key)
 * 3. OAuth 2.0 (Bearer Token Client Credentials)
 */
export const verifyPaymentWebhookAuth = (
  req: PaymentAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const webhookKey = process.env.SEPAY_WEBHOOK_KEY?.trim();
  const hmacSecret = (process.env.SEPAY_WEBHOOK_SECRET || process.env.SEPAY_WEBHOOK_KEY)?.trim();

  // 1. Thu thập thông tin xác thực từ Headers và Query
  const authHeader = (req.headers.authorization || '').trim();
  const customApiKey = (req.headers['x-api-key'] as string || '').trim();
  const signature = (
    req.headers['x-sepay-signature'] ||
    req.headers['x-signature'] ||
    req.headers['signature'] ||
    req.query.signature ||
    ''
  ) as string;
  const timestamp = (
    req.headers['x-timestamp'] ||
    req.headers['x-request-timestamp'] ||
    req.body?.transactionDate ||
    req.body?.timestamp ||
    ''
  ) as string;

  // 2. Kiểm tra Replay Attack nếu có Timestamp
  if (timestamp) {
    const replayCheck = verifyReplayAttack(timestamp, 300); // 5 phút
    if (!replayCheck.valid) {
      console.warn(`🚨 [PaymentSecurity] Replay Attack phát hiện hoặc timestamp hết hạn: ${replayCheck.reason}`);
      return res.status(401).json({
        success: false,
        message: `Xác thực thanh toán thất bại: ${replayCheck.reason}`,
      });
    }
  }

  // 3. Cơ chế 1: Xác thực qua Chữ ký HMAC-SHA256
  if (signature && hmacSecret) {
    const isHmacValid = verifyHmacSha256(req.body, hmacSecret, signature);
    if (isHmacValid) {
      req.paymentAuth = {
        method: 'HMAC-SHA256',
        authenticated: true,
        details: { signatureVerified: true },
      };
      return next();
    }
    console.warn(`🚨 [PaymentSecurity] Chữ ký HMAC-SHA256 không hợp lệ.`);
  }

  // 4. Cơ chế 2: Xác thực qua API Key
  const incomingApiKey = customApiKey || authHeader.replace(/^(Bearer|Apikey)\s+/i, '').trim();
  if (incomingApiKey && webhookKey) {
    if (timingSafeEqualString(incomingApiKey, webhookKey)) {
      req.paymentAuth = {
        method: 'API_KEY',
        authenticated: true,
      };
      return next();
    }
  }

  // 5. Cơ chế 3: Xác thực qua OAuth 2.0 Bearer Token
  if (authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    const oauthResult = verifyOAuthPaymentToken(bearerToken);
    if (oauthResult.valid) {
      req.paymentAuth = {
        method: 'OAUTH2',
        authenticated: true,
        details: oauthResult.payload,
      };
      return next();
    }
  }

  // 6. Cho phép bypass khi chạy môi trường Local / Dev chưa cấu hình Secret
  if (!isProduction && !webhookKey && !hmacSecret) {
    console.warn(
      '⚠️ [PaymentSecurity - Dev Warning] Webhook được gọi nhưng chưa cấu hình SEPAY_WEBHOOK_KEY hoặc SEPAY_WEBHOOK_SECRET. Tạm thời cho phép vì đang chạy môi trường Development.'
    );
    req.paymentAuth = {
      method: 'DEV_BYPASS',
      authenticated: false,
    };
    return next();
  }

  // 7. Từ chối nếu không vượt qua bất kỳ phương thức nào
  console.warn(`🚨 [PaymentSecurity] Từ chối Webhook không xác thực: IP ${req.ip}, Path ${req.originalUrl}`);
  return res.status(401).json({
    success: false,
    message: 'Unauthorized: Webhook yêu cầu xác thực hợp lệ (API Key, HMAC-SHA256 Signature, hoặc OAuth 2.0 Token)',
  });
};

/**
 * Middleware bảo vệ endpoint mô phỏng thanh toán (Dev Simulate)
 * Không cho phép gọi tự do trên môi trường Production
 */
export const protectDevSimulate = (
  req: PaymentAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowDevSimulate = process.env.ALLOW_DEV_SIMULATE === 'true';

  // Ở môi trường Dev hoặc khi bật cờ ALLOW_DEV_SIMULATE => Cho phép
  if (!isProduction || allowDevSimulate) {
    return next();
  }

  // Trên Production: Chỉ cho phép Admin hoặc cung cấp khóa DEV_SIMULATE_KEY
  const devKeyHeader = (req.headers['x-dev-simulate-key'] as string || '').trim();
  const configuredDevKey = process.env.DEV_SIMULATE_KEY?.trim();

  if (configuredDevKey && timingSafeEqualString(devKeyHeader, configuredDevKey)) {
    return next();
  }

  if (req.user && String(req.user.role || '').toUpperCase() === Role.ADMIN) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Tính năng mô phỏng thanh toán bị vô hiệu hóa trên môi trường Production.',
  });
};
