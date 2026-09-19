import assert from 'assert';
import {
  timingSafeEqualString,
  computeHmacSha256,
  verifyHmacSha256,
  verifyReplayAttack,
  generateOAuthPaymentToken,
  verifyOAuthPaymentToken,
} from '../utils/paymentSecurity';
import {
  verifyPaymentWebhookAuth,
  protectDevSimulate,
  PaymentAuthRequest,
} from '../middleware/paymentSecurityMiddleware';

console.log('🧪 Bắt đầu chạy bộ kiểm thử Payment Security (API Key, HMAC-SHA256, OAuth 2.0)...\n');

let passedTests = 0;
let failedTests = 0;

function it(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(() => {
        console.log(`  ✅ PASS: ${name}`);
        passedTests++;
      }).catch((err) => {
        console.error(`  ❌ FAIL: ${name}`, err.message);
        failedTests++;
      });
    } else {
      console.log(`  ✅ PASS: ${name}`);
      passedTests++;
    }
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${name}`, err.message);
    failedTests++;
  }
}

async function runTests() {
  // ============================================================================
  // Test 1: Timing-safe string comparison
  // ============================================================================
  console.log('📌 1. Kiểm thử Timing-Safe String Comparison:');
  it('So khớp chính xác 2 chuỗi giống hệt nhau', () => {
    assert.strictEqual(timingSafeEqualString('secret_key_123', 'secret_key_123'), true);
  });

  it('Từ chối khi chuỗi sai ký tự', () => {
    assert.strictEqual(timingSafeEqualString('secret_key_123', 'secret_key_999'), false);
  });

  it('Từ chối an toàn khi độ dài chuỗi khác nhau', () => {
    assert.strictEqual(timingSafeEqualString('short', 'much_longer_string'), false);
  });

  it('Từ chối khi chuỗi rỗng hoặc undefined/null', () => {
    assert.strictEqual(timingSafeEqualString('', 'secret'), false);
    assert.strictEqual(timingSafeEqualString(null, 'secret'), false);
    assert.strictEqual(timingSafeEqualString(undefined, undefined), false);
  });

  // ============================================================================
  // Test 2: HMAC-SHA256 Signature Computation & Verification
  // ============================================================================
  console.log('\n📌 2. Kiểm thử HMAC-SHA256 Signature:');
  const testSecret = 'my_super_secret_webhook_key_2026';
  const testPayload = {
    id: 12345,
    gateway: 'MBBank',
    transferAmount: 199000,
    content: 'AGRI123456 NANG CAP GOI',
  };

  const expectedSignature = computeHmacSha256(testPayload, testSecret);

  it('Sinh chữ ký HMAC-SHA256 hợp lệ với độ dài 64 ký tự hex', () => {
    assert.strictEqual(typeof expectedSignature, 'string');
    assert.strictEqual(expectedSignature.length, 64);
  });

  it('Xác thực chữ ký HMAC-SHA256 thành công khi đúng secret và payload', () => {
    const isValid = verifyHmacSha256(testPayload, testSecret, expectedSignature);
    assert.strictEqual(isValid, true);
  });

  it('Từ chối khi payload bị sửa đổi (toàn vẹn dữ liệu bị xâm phạm)', () => {
    const tamperedPayload = { ...testPayload, transferAmount: 1000 };
    const isValid = verifyHmacSha256(tamperedPayload, testSecret, expectedSignature);
    assert.strictEqual(isValid, false);
  });

  it('Từ chối khi chữ ký giả mạo hoặc sai secret', () => {
    const isValidWrongSecret = verifyHmacSha256(testPayload, 'wrong_secret', expectedSignature);
    assert.strictEqual(isValidWrongSecret, false);

    const isValidBadSignature = verifyHmacSha256(testPayload, testSecret, 'abcdef1234567890');
    assert.strictEqual(isValidBadSignature, false);
  });

  // ============================================================================
  // Test 3: Replay Attack Protection
  // ============================================================================
  console.log('\n📌 3. Kiểm thử Replay Attack Protection (Timestamp):');
  it('Chấp nhận timestamp hiện tại (trong vòng 5 phút)', () => {
    const nowIso = new Date().toISOString();
    const check = verifyReplayAttack(nowIso, 300);
    assert.strictEqual(check.valid, true);
  });

  it('Từ chối request đã quá 5 phút (Replay attack)', () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const check = verifyReplayAttack(tenMinutesAgo, 300);
    assert.strictEqual(check.valid, false);
  });

  it('Từ chối timestamp trong tương lai xa (> 60s)', () => {
    const farFuture = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const check = verifyReplayAttack(farFuture, 300);
    assert.strictEqual(check.valid, false);
  });

  // ============================================================================
  // Test 4: OAuth 2.0 Client Credentials Grant
  // ============================================================================
  console.log('\n📌 4. Kiểm thử OAuth 2.0 Client Credentials:');
  process.env.PAYMENT_CLIENT_ID = 'test_client_id';
  process.env.PAYMENT_CLIENT_SECRET = 'test_client_secret_key';
  process.env.JWT_SECRET = 'test_jwt_secret_min_32_characters_long';

  it('Cấp phát Access Token OAuth 2.0 thành công với client_id & secret hợp lệ', () => {
    const token = generateOAuthPaymentToken('test_client_id', 'test_client_secret_key');
    assert.notStrictEqual(token, null);
    assert.strictEqual(token?.token_type, 'Bearer');
    assert.strictEqual(typeof token?.access_token, 'string');
    assert.strictEqual(token?.expires_in, 3600);
  });

  it('Từ chối cấp phát token khi sai client_secret', () => {
    const token = generateOAuthPaymentToken('test_client_id', 'wrong_secret');
    assert.strictEqual(token, null);
  });

  it('Xác thực OAuth 2.0 Bearer Token hợp lệ', () => {
    const token = generateOAuthPaymentToken('test_client_id', 'test_client_secret_key');
    const verifyResult = verifyOAuthPaymentToken(token!.access_token);
    assert.strictEqual(verifyResult.valid, true);
    assert.strictEqual(verifyResult.payload?.sub, 'test_client_id');
  });

  it('Từ chối OAuth 2.0 Bearer Token giả mạo', () => {
    const verifyResult = verifyOAuthPaymentToken('invalid.jwt.token');
    assert.strictEqual(verifyResult.valid, false);
  });

  // ============================================================================
  // Test 5: Webhook Security Middleware (Multi-method Verification)
  // ============================================================================
  console.log('\n📌 5. Kiểm thử Middleware Xác thực Webhook:');
  process.env.NODE_ENV = 'production';
  process.env.SEPAY_WEBHOOK_KEY = 'valid_api_key_123';
  process.env.SEPAY_WEBHOOK_SECRET = testSecret;

  it('Cho phép Webhook qua cơ chế API Key (Authorization: Bearer <key>)', () => {
    let nextCalled = false;
    const req: any = {
      headers: { authorization: 'Bearer valid_api_key_123' },
      body: testPayload,
      query: {},
    };
    const res: any = { status: () => res, json: () => res };
    verifyPaymentWebhookAuth(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.paymentAuth?.method, 'API_KEY');
  });

  it('Cho phép Webhook qua cơ chế HMAC-SHA256 (x-signature)', () => {
    let nextCalled = false;
    const req: any = {
      headers: { 'x-signature': expectedSignature },
      body: testPayload,
      query: {},
    };
    const res: any = { status: () => res, json: () => res };
    verifyPaymentWebhookAuth(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.paymentAuth?.method, 'HMAC-SHA256');
  });

  it('Cho phép Webhook qua cơ chế OAuth 2.0 Token (Authorization: Bearer <oauth_token>)', () => {
    let nextCalled = false;
    const oauthToken = generateOAuthPaymentToken('test_client_id', 'test_client_secret_key');
    const req: any = {
      headers: { authorization: `Bearer ${oauthToken!.access_token}` },
      body: testPayload,
      query: {},
    };
    const res: any = { status: () => res, json: () => res };
    verifyPaymentWebhookAuth(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.paymentAuth?.method, 'OAUTH2');
  });

  it('Từ chối Webhook khi không có bất kỳ xác thực nào trên Production', () => {
    let statusCode = 0;
    let errorResponse: any = null;
    const req: any = {
      headers: {},
      body: testPayload,
      query: {},
      ip: '1.2.3.4',
      originalUrl: '/api/payment/sepay-webhook',
    };
    const res: any = {
      status: (code: number) => { statusCode = code; return res; },
      json: (data: any) => { errorResponse = data; return res; },
    };
    verifyPaymentWebhookAuth(req, res, () => {});
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(errorResponse?.success, false);
  });

  // ============================================================================
  // Test 6: Protect Dev-Simulate in Production
  // ============================================================================
  console.log('\n📌 6. Kiểm thử Bảo vệ Dev-Simulate trên Production:');
  process.env.NODE_ENV = 'production';
  delete process.env.ALLOW_DEV_SIMULATE;

  it('Chặn gọi /dev-simulate trên Production đối với request thông thường', () => {
    let statusCode = 0;
    const req: any = { headers: {} };
    const res: any = {
      status: (code: number) => { statusCode = code; return res; },
      json: () => res,
    };
    protectDevSimulate(req, res, () => {});
    assert.strictEqual(statusCode, 403);
  });

  it('Cho phép gọi /dev-simulate khi có quyền ADMIN', () => {
    let nextCalled = false;
    const req: any = { headers: {}, user: { role: 'admin' } };
    const res: any = { status: () => res, json: () => res };
    protectDevSimulate(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
  });

  // ============================================================================
  // Tổng kết
  // ============================================================================
  console.log(`\n========================================`);
  console.log(`🏁 Kết quả kiểm thử: ${passedTests} passed, ${failedTests} failed`);
  console.log(`========================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
