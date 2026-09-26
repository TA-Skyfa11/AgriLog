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
 * Tính toán chữ ký HMAC-SHA256 cho payload bất kỳ (hỗ trợ Buffer thô, string, hoặc Object)
 */
export function computeHmacSha256(payload: any, secret: string): string {
  if (!secret) return '';

  if (Buffer.isBuffer(payload)) {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  const dataString =
    typeof payload === 'string'
      ? payload
      : JSON.stringify(sortObjectKeys(payload));

  return crypto.createHmac('sha256', secret).update(dataString, 'utf8').digest('hex');
}

/**
 * Xác thực chữ ký HMAC-SHA256 nhận được với secret key
 * Hỗ trợ:
 * 1. Raw buffer / raw string từ Webhook SePay (ưu tiên cao nhất, chống lỗi sai lệch do serialize)
 * 2. Tự động cắt bỏ tiền tố "sha256=" nếu có
 * 3. So khớp cả dạng hex và base64
 * 4. Fallback kiểm tra dạng canonical object và raw JSON string
 */
export function verifyHmacSha256(
  payload: any,
  secret: string,
  signature?: string | null
): boolean {
  if (!secret || !signature || typeof signature !== 'string') return false;

  const rawSig = signature.trim();
  const cleanSignature = rawSig.replace(/^sha256=/i, '').toLowerCase();

  // 1. Kiểm tra ưu tiên: Payload thô (Buffer hoặc String trực tiếp từ HTTP request của SePay)
  if (Buffer.isBuffer(payload) || typeof payload === 'string') {
    const rawBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');

    // So khớp Hex
    const computedHex = crypto.createHmac('sha256', secret).update(rawBuffer).digest('hex');
    if (timingSafeEqualString(computedHex.toLowerCase(), cleanSignature)) {
      return true;
    }

    // So khớp Base64
    const computedBase64 = crypto.createHmac('sha256', secret).update(rawBuffer).digest('base64');
    if (timingSafeEqualString(computedBase64, rawSig)) {
      return true;
    }

    // Fallback: Thử parse JSON nếu là buffer/string để kiểm tra chữ ký kiểu sorted keys
    try {
      const parsed = JSON.parse(rawBuffer.toString('utf8'));
      if (parsed && typeof parsed === 'object') {
        const computedCanonical = computeHmacSha256(parsed, secret);
        if (timingSafeEqualString(computedCanonical.toLowerCase(), cleanSignature)) {
          return true;
        }
      }
    } catch {
      // Không phải JSON, bỏ qua
    }

    return false;
  }

  // 2. Kiểm tra với payload dạng canonical (sorted keys) khi payload đã được parse thành Object
  const computedCanonical = computeHmacSha256(payload, secret);
  if (timingSafeEqualString(computedCanonical.toLowerCase(), cleanSignature)) {
    return true;
  }

  // 3. Kiểm tra với payload dạng JSON thuần nếu payload là object
  if (typeof payload === 'object' && payload !== null) {
    const rawJson = JSON.stringify(payload);
    const directComputed = crypto.createHmac('sha256', secret).update(rawJson, 'utf8').digest('hex');
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

  // Cho phép chênh lệch đồng hồ máy chủ tối đa 120 giây (2 phút) trong tương lai (hữu ích cho Windows VPS)
  if (diffSeconds < -120) {
    return {
      valid: false,
      reason: 'Timestamp trong tương lai vượt quá giới hạn sai lệch đồng hồ (120s)',
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
