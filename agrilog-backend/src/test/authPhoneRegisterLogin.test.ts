import { connectDB } from '../config/db';
import { User, Role } from '../models/User';
import { registerSchema, loginSchema } from '../validations/authValidation';
import bcrypt from 'bcryptjs';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runAuthPhoneTests() {
  console.log('========================================================================');
  console.log('📱 AGRILOG AUTHENTICATION: PHONE REGISTRATION & MULTI-IDENTIFIER LOGIN 📱');
  console.log('========================================================================\n');

  await connectDB();

  console.log('🧪 1. Kiểm thử Zod Schema Validation:');

  // Register without phone should fail
  const noPhoneRes = registerSchema.safeParse({
    name: 'Nguyễn Văn Test',
    password: 'password123',
    role: Role.FARM,
  });
  assert(!noPhoneRes.success, 'Bắt buộc phải có số điện thoại khi đăng ký (thiếu SĐT bị chặn)');

  // Register with invalid phone should fail
  const invalidPhoneRes = registerSchema.safeParse({
    name: 'Nguyễn Văn Test',
    phone: '12345',
    password: 'password123',
  });
  assert(!invalidPhoneRes.success, 'SĐT không đúng định dạng (12345) bị từ chối');

  // Register with valid phone and NO email should succeed
  const validPhoneNoEmail = registerSchema.safeParse({
    name: 'Nguyễn Văn Test',
    phone: '0987111222',
    password: 'password123',
  });
  assert(validPhoneNoEmail.success, 'Đăng ký chỉ với SĐT (không có email) hợp lệ');

  // Register with valid phone and empty string email should succeed
  const validPhoneEmptyEmail = registerSchema.safeParse({
    name: 'Nguyễn Văn Test',
    phone: '0987111222',
    email: '',
    password: 'password123',
  });
  assert(validPhoneEmptyEmail.success, 'Đăng ký với SĐT và email là chuỗi rỗng hợp lệ');

  // Register with valid phone and invalid email should fail
  const validPhoneBadEmail = registerSchema.safeParse({
    name: 'Nguyễn Văn Test',
    phone: '0987111222',
    email: 'not-an-email',
    password: 'password123',
  });
  assert(!validPhoneBadEmail.success, 'Email sai định dạng bị từ chối');

  // Register with valid phone and valid email should succeed
  const validPhoneAndEmail = registerSchema.safeParse({
    name: 'Nguyễn Văn Test',
    phone: '0987111222',
    email: 'test@agrilog.vn',
    password: 'password123',
  });
  assert(validPhoneAndEmail.success, 'Đăng ký đầy đủ cả SĐT và email hợp lệ');

  // Login schema validations
  const loginWithPhone = loginSchema.safeParse({
    identifier: '0987111222',
    password: 'password123',
  });
  assert(loginWithPhone.success, 'Đăng nhập với trường identifier là SĐT hợp lệ');

  const loginWithEmail = loginSchema.safeParse({
    identifier: 'test@agrilog.vn',
    password: 'password123',
  });
  assert(loginWithEmail.success, 'Đăng nhập với trường identifier là email hợp lệ');

  const loginWithLegacyEmail = loginSchema.safeParse({
    email: '0987111222',
    password: 'password123',
  });
  assert(loginWithLegacyEmail.success, 'Đăng nhập với trường email chứa SĐT (tương thích ngược) hợp lệ');

  const loginEmpty = loginSchema.safeParse({
    identifier: '',
    password: 'password123',
  });
  assert(!loginEmpty.success, 'Đăng nhập bỏ trống thông tin bị chặn');

  console.log('\n🧪 2. Kiểm thử Tạo tài khoản & Đăng nhập vào Cơ sở dữ liệu:');

  const testPhone1 = '0988777666';
  const testPhone2 = '0988555444';
  const testEmail2 = 'user_two@agrilog-test.vn';

  // Clean up any previous test records
  await User.deleteMany({
    $or: [
      { phone: testPhone1 },
      { phone: testPhone2 },
      { email: testEmail2 },
    ]
  });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('TestPass123', salt);

  // User 1: Registered with Phone only (no email)
  const user1 = await User.create({
    name: 'Nông dân SĐT',
    phone: testPhone1,
    passwordHash,
    role: Role.FARM,
  });
  assert(!!user1._id && user1.phone === testPhone1, 'Tạo thành công tài khoản Nông dân chỉ dùng SĐT');

  // User 2: Registered with Phone and Email
  const user2 = await User.create({
    name: 'Nông dân Đủ Thông Tin',
    phone: testPhone2,
    email: testEmail2,
    passwordHash,
    role: Role.FARM,
  });
  assert(!!user2._id && user2.phone === testPhone2 && user2.email === testEmail2, 'Tạo thành công tài khoản có cả SĐT và email');

  // Login simulation for User 1 using Phone
  const foundUser1ByPhone = await User.findOne({
    $or: [
      { phone: testPhone1 },
      { email: testPhone1 }
    ]
  });
  assert(!!foundUser1ByPhone && foundUser1ByPhone._id.toString() === user1._id.toString(), 'User 1 đăng nhập thành công bằng Số điện thoại');

  // Login simulation for User 2 using Phone
  const foundUser2ByPhone = await User.findOne({
    $or: [
      { phone: testPhone2 },
      { email: testPhone2 }
    ]
  });
  assert(!!foundUser2ByPhone && foundUser2ByPhone._id.toString() === user2._id.toString(), 'User 2 đăng nhập thành công bằng Số điện thoại');

  // Login simulation for User 2 using Email
  const foundUser2ByEmail = await User.findOne({
    $or: [
      { phone: testEmail2 },
      { email: testEmail2 }
    ]
  });
  assert(!!foundUser2ByEmail && foundUser2ByEmail._id.toString() === user2._id.toString(), 'User 2 đăng nhập thành công bằng Email');

  // Cleanup
  await User.deleteMany({
    $or: [
      { phone: testPhone1 },
      { phone: testPhone2 },
      { email: testEmail2 },
    ]
  });
  console.log('  🧹 Đã dọn dẹp các tài khoản kiểm thử.');

  console.log('\n========================================================================');
  console.log(`🏁 Kết quả kiểm thử Auth Phone & Login: ${passed} passed, ${failed} failed`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthPhoneTests().catch((err) => {
  console.error('Lỗi thực thi kiểm thử auth phone:', err);
  process.exit(1);
});
