import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// ==============================================================================
// 1. Timing-Safe String Comparison (Chống Timing Attack)
// ==============================================================================
/**
 * So sánh 2 chuỗi với thời gian thực thi độc lập với nội dung chuỗi (Constant Time)
 * Nhằm ngăn chặn tin tặc đo thời gian phản hồi để đoán từng ký tự của API Key hoặc Secret.
 */
export function timingSafeEqualString(a?: string | null, b?: string | null): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (!a.length || !b.length) return false;

  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    // Thực hiện so sánh giả lập để triệt tiêu chênh lệch thời gian do độ dài khác nhau
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

// ==============================================================================
// 2. HMAC-SHA256 Signature Verification (Chữ ký điện tử toàn vẹn dữ liệu)
// ==============================================================================
/**
 * Sắp xếp các khóa của object theo thứ tự bảng chữ cái để tạo chuỗi canonical nhất quán
 */
export function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  return Object.keys(obj)
    .sort()
    .reduce((result: Record<string, any>, key: string) => {
      result[key] = sortObjectKeys(obj[key]);
      return result;
    }, {});
}

/**
 * Tính toán chữ ký HMAC-SHA256 cho payload bất kỳ
 */
export function computeHmacSha256(payload: any, secret: string): string {
  if (!secret) return '';

  const dataString =
    typeof payload === 'string'
      ? payload
      : Buffer.isBuffer(payload)
      ? payload.toString('utf8')
      : JSON.stringify(sortObjectKeys(payload));

  return crypto.createHmac('sha256', secret).update(dataString).digest('hex');
}

/**
 * Xác thực chữ ký HMAC-SHA256 nhận được với secret key
 */
export function verifyHmacSha256(
  payload: any,
  secret: string,
  signature?: string | null
): boolean {
  if (!secret || !signature || typeof signature !== 'string') return false;

  const cleanSignature = signature.trim().toLowerCase();

  // 1. Kiểm tra với payload dạng canonical (sorted keys)
  const computedCanonical = computeHmacSha256(payload, secret);
  if (timingSafeEqualString(computedCanonical.toLowerCase(), cleanSignature)) {
    return true;
  }

  // 2. Kiểm tra với payload dạng JSON thuần nếu payload là object
  if (typeof payload === 'object' && payload !== null) {
    const rawJson = JSON.stringify(payload);
    const directComputed = crypto.createHmac('sha256', secret).update(rawJson).digest('hex');
    if (timingSafeEqualString(directComputed.toLowerCase(), cleanSignature)) {
      return true;
    }
  }

  return false;
}

// ==============================================================================
// 3. Replay Attack Protection (Chống tấn công phát lại bằng Timestamp)
// ==============================================================================
/**
 * Kiểm tra xem timestamp của request có nằm trong thời hạn cho phép không
 * @param timestamp Chuỗi ISO date hoặc số epoch millis/seconds
 * @param maxAgeSeconds Thời gian tối đa chấp nhận (mặc định 300 giây = 5 phút)
 */
export function verifyReplayAttack(
  timestamp?: string | number | null,
  maxAgeSeconds: number = 300
): { valid: boolean; reason?: string } {
  if (!timestamp) {
    return { valid: true };
  }

  const tsMs =
    typeof timestamp === 'number'
      ? timestamp > 1e11
        ? timestamp
        : timestamp * 1000
      : Date.parse(timestamp);

  if (isNaN(tsMs)) {
    return { valid: false, reason: 'Định dạng timestamp không hợp lệ' };
  }

  const now = Date.now();
  const diffSeconds = (now - tsMs) / 1000;

  // Nếu request đã quá cũ (quá maxAgeSeconds)
  if (diffSeconds > maxAgeSeconds) {
    return {
      valid: false,
      reason: `Request đã hết hạn (${Math.round(diffSeconds)}s > ${maxAgeSeconds}s)`,
    };
  }

  // Cho phép chênh lệch đồng hồ máy chủ tối đa 60 giây trong tương lai
  if (diffSeconds < -60) {
    return {
      valid: false,
      reason: 'Timestamp trong tương lai vượt quá giới hạn sai lệch đồng hồ (60s)',
    };
  }

  return { valid: true };
}

// ==============================================================================
// 4. OAuth 2.0 Machine-to-Machine (Client Credentials Grant - RFC 6749)
// ==============================================================================
export interface OAuthTokenResult {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

/**
 * Sinh token OAuth 2.0 cho Client Credentials
 */
export function generateOAuthPaymentToken(
  clientId: string,
  clientSecret: string,
  scope: string = 'payment:webhook'
): OAuthTokenResult | null {
  const validClientId = process.env.PAYMENT_CLIENT_ID || 'agrilog_payment_client';
  const validClientSecret =
    process.env.PAYMENT_CLIENT_SECRET || process.env.SEPAY_WEBHOOK_KEY || 'agrilog_payment_secret';

  if (
    !timingSafeEqualString(clientId, validClientId) ||
    !timingSafeEqualString(clientSecret, validClientSecret)
  ) {
    return null;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('🚨 [PaymentSecurity] Không thể cấp phát OAuth token: JWT_SECRET chưa được cấu hình.');
    return null;
  }
  const expiresIn = 3600; // 1 giờ

  const access_token = jwt.sign(
    {
      iss: 'agrilog-payment-auth-server',
      sub: clientId,
      scope,
      type: 'oauth2_client_credentials',
    },
    jwtSecret,
    { expiresIn }
  );

  return {
    access_token,
    token_type: 'Bearer',
    expires_in: expiresIn,
    scope,
  };
}

/**
 * Xác thực token OAuth 2.0 Bearer Token
 */
export function verifyOAuthPaymentToken(token: string): { valid: boolean; payload?: any } {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return { valid: false };
    }
    const decoded = jwt.verify(token, jwtSecret) as any;
    if (decoded && decoded.type === 'oauth2_client_credentials') {
      return { valid: true, payload: decoded };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}
