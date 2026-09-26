import { Request, Response, NextFunction } from 'express';
import {
  timingSafeEqualString,
  verifyHmacSha256,
  verifyReplayAttack,
  verifyOAuthPaymentToken,
} from '../utils/paymentSecurity';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models/User';

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
  const sepayApiKey = process.env.SEPAY_API_KEY?.trim();
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
    ''
  ) as string;

  // 2. Kiểm tra Replay Attack nếu có Timestamp trong Headers
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

  // 4. Cơ chế 2: Xác thực qua API Key (Hỗ trợ cả SEPAY_WEBHOOK_KEY và SEPAY_API_KEY)
  const incomingApiKey = customApiKey || authHeader.replace(/^(Bearer|Apikey)\s+/i, '').trim();
  if (incomingApiKey) {
    if (webhookKey && timingSafeEqualString(incomingApiKey, webhookKey)) {
      req.paymentAuth = {
        method: 'API_KEY',
        authenticated: true,
      };
      return next();
    }
    if (sepayApiKey && timingSafeEqualString(incomingApiKey, sepayApiKey)) {
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
 * Chỉ cho phép khi:
 * 1. Cung cấp khóa bí mật DEV_SIMULATE_KEY hợp lệ (CI / testing).
 * 2. Hoặc tài khoản đăng nhập có quyền ADMIN.
 * 3. Hoặc tài khoản đăng nhập được Admin cấp phép bypass (allowDevPayment === true).
 * Mọi tài khoản thông thường khác sẽ bị từ chối 403 Forbidden.
 */
export const protectDevSimulate = async (
  req: PaymentAuthRequest,
  res: Response,
  next: NextFunction
) => {
  // 1. Kiểm tra khóa x-dev-simulate-key (CI / automated scripts)
  const devKeyHeader = (req.headers['x-dev-simulate-key'] as string || '').trim();
  const configuredDevKey = process.env.DEV_SIMULATE_KEY?.trim();

  if (configuredDevKey && timingSafeEqualString(devKeyHeader, configuredDevKey)) {
    return next();
  }

  // 2. Nếu req.user đã có sẵn (từ middleware protect hoặc test mock)
  if (req.user) {
    const role = String(req.user.role || '').toUpperCase();
    if (role === Role.ADMIN || req.user.allowDevPayment === true) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Tài khoản chưa được Admin cấp phép sử dụng chức năng mô phỏng thanh toán (Dev Test).',
    });
  }

  // 3. Nếu chưa có req.user, thử trích xuất từ Bearer JWT token hoặc Session
  let userId = (req as any).session?.userId;
  if (!userId) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const secret = process.env.JWT_SECRET;
          if (secret) {
            const decoded = jwt.verify(token, secret) as { id: string };
            userId = decoded.id;
          }
        } catch {}
      }
    }
  }

  if (userId) {
    try {
      const user = await User.findById(userId);
      if (user) {
        req.user = user;
        const role = String(user.role || '').toUpperCase();
        if (role === Role.ADMIN || user.allowDevPayment === true) {
          return next();
        }
      }
    } catch {}
  }

  return res.status(403).json({
    success: false,
    message: 'Tài khoản chưa được Admin cấp phép sử dụng chức năng mô phỏng thanh toán (Dev Test).',
  });
};
