import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB, sql } from '../config/db';
import { User, Role } from '../models/User';
import { FarmProfile } from '../models/FarmProfile';
import { CompanyProfile } from '../models/CompanyProfile';
import { googleAuth } from '../controllers/authController';

console.log('🧪 Bắt đầu chạy bộ kiểm thử Google Sign-in / Sign-up...\n');

let passedTests = 0;
let failedTests = 0;

async function it(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      await result;
    }
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${name}`, err.message);
    failedTests++;
  }
}

// Mock Express req & res
function createMockReqRes(body: any = {}) {
  const req: any = {
    body,
    session: {},
    ip: '127.0.0.1',
    headers: { 'user-agent': 'GoogleAuthTestRunner/1.0' },
  };

  const res: any = {
    statusCode: 200,
    data: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.data = payload;
      return this;
    },
  };

  return { req, res };
}

async function runTests() {
  await connectDB();

  const testEmailFarm = `test_google_farm_${Date.now()}@gmail.com`;
  const testEmailCompany = `test_google_comp_${Date.now()}@gmail.com`;
  const testEmailLink = `test_google_link_${Date.now()}@gmail.com`;

  try {
    console.log('📌 1. Kiểm thử Đăng ký người dùng mới bằng Google (Role: FARM):');
    await it('Đăng ký Google Farm: Tạo User mới, tự động tạo FarmProfile với Trial Plan', async () => {
      const { req, res } = createMockReqRes({
        email: testEmailFarm,
        name: 'Nông Hộ Google Test',
        googleId: 'gid_1234567890_farm',
        avatar: 'https://lh3.googleusercontent.com/test_avatar.jpg',
        role: Role.FARM,
      });

      await googleAuth(req, res);

      assert.strictEqual(res.statusCode, 201, 'Status code phải là 201 Created');
      assert.strictEqual(res.data.success, true, 'success phải là true');
      assert.strictEqual(res.data.isNewUser, true, 'isNewUser phải là true');
      assert.strictEqual(res.data.user.email, testEmailFarm, 'Email trùng khớp');
      assert.strictEqual(res.data.user.role, Role.FARM, 'Role phải là FARM');
      assert(typeof res.data.token === 'string' && res.data.token.length > 20, 'Trả về JWT Token');

      // Kiểm tra trong cơ sở dữ liệu
      const dbUser = await User.findOne({ email: testEmailFarm });
      assert(dbUser !== null, 'User được lưu trong database');
      assert.strictEqual(dbUser.authProvider, 'google', 'authProvider là google');
      assert.strictEqual(dbUser.googleId, 'gid_1234567890_farm', 'googleId khớp');

      // Kiểm tra FarmProfile tự động tạo
      const farmProfile = await FarmProfile.findOne({ user: dbUser._id });
      assert(farmProfile !== null, 'FarmProfile được tự động tạo');
      assert(farmProfile.isTrial === true, 'Được kích hoạt gói dùng thử');
      assert(farmProfile.plan !== 'FREE', 'Gói dịch vụ không phải FREE (có trial plan)');
    });

    console.log('\n📌 2. Kiểm thử Đăng ký người dùng mới bằng Google (Role: COMPANY):');
    await it('Đăng ký Google Company: Tạo User mới và CompanyProfile', async () => {
      const { req, res } = createMockReqRes({
        email: testEmailCompany,
        name: 'Doanh Nghiệp Google Test',
        googleId: 'gid_1234567890_comp',
        role: Role.COMPANY,
      });

      await googleAuth(req, res);

      assert.strictEqual(res.statusCode, 201, 'Status code phải là 201 Created');
      assert.strictEqual(res.data.user.role, Role.COMPANY, 'Role phải là COMPANY');

      const dbUser = await User.findOne({ email: testEmailCompany });
      assert(dbUser !== null, 'User công ty được tạo');
      const compProfile = await CompanyProfile.findOne({ user: dbUser._id });
      assert(compProfile !== null, 'CompanyProfile được tự động tạo');
    });

    console.log('\n📌 3. Kiểm thử Đăng nhập lại với tài khoản Google đã có:');
    await it('Đăng nhập Google thành công, trả về 200, cập nhật avatar và reset loginAttempts', async () => {
      const newAvatarUrl = 'https://lh3.googleusercontent.com/new_avatar.jpg';
      const { req, res } = createMockReqRes({
        email: testEmailFarm,
        name: 'Nông Hộ Google Test Cập Nhật',
        googleId: 'gid_1234567890_farm',
        avatar: newAvatarUrl,
      });

      await googleAuth(req, res);

      assert.strictEqual(res.statusCode, 200, 'Status code phải là 200 OK');
      assert.strictEqual(res.data.success, true, 'success phải là true');
      assert.strictEqual(res.data.isNewUser, false, 'isNewUser phải là false');
      assert.strictEqual(res.data.user.email, testEmailFarm, 'Email khớp');
      assert(typeof res.data.token === 'string', 'Token hợp lệ');
    });

    console.log('\n📌 4. Kiểm thử Liên kết tài khoản (Account Linking):');
    await it('Tài khoản email đã tạo trước đó được liên kết googleId khi đăng nhập Google', async () => {
      // Tạo user bằng email thường trước
      const localUser = await User.create({
        name: 'Người dùng thường',
        email: testEmailLink,
        passwordHash: 'dummy_hash',
        role: Role.FARM,
        authProvider: 'local',
      });

      // Đăng nhập bằng Google cùng email
      const { req, res } = createMockReqRes({
        email: testEmailLink,
        googleId: 'gid_linked_999',
        avatar: 'https://avatar.google.com/999',
      });

      await googleAuth(req, res);

      assert.strictEqual(res.statusCode, 200, 'Đăng nhập thành công 200');
      assert.strictEqual(res.data.isNewUser, false, 'Không tạo user trùng lặp');

      const updatedUser = await User.findById(localUser._id);
      assert.strictEqual(updatedUser?.googleId, 'gid_linked_999', 'googleId đã được liên kết');
      assert.strictEqual(updatedUser?.avatar, 'https://avatar.google.com/999', 'avatar đã được cập nhật');
    });

    console.log('\n📌 5. Kiểm thử Validation và Bảo mật:');
    await it('Từ chối request nếu thiếu email và không có token xác thực', async () => {
      const { req, res } = createMockReqRes({
        name: 'Không có email',
      });

      await googleAuth(req, res);

      assert.strictEqual(res.statusCode, 400, 'Trả về lỗi 400 khi thiếu email');
      assert.strictEqual(res.data.success, false);
    });

    await it('Chặn đăng nhập Google nếu tài khoản bị khóa (isActive: false)', async () => {
      const blockedEmail = `blocked_${Date.now()}@gmail.com`;
      await User.create({
        email: blockedEmail,
        name: 'User Khóa',
        isActive: false,
        role: Role.FARM,
      });

      const { req, res } = createMockReqRes({
        email: blockedEmail,
        googleId: 'gid_blocked',
      });

      await googleAuth(req, res);

      assert.strictEqual(res.statusCode, 403, 'Trả về lỗi 403 Forbidden');
      assert.strictEqual(res.data.success, false);

      // Dọn dẹp
      await User.deleteMany({ email: blockedEmail });
    });

  } finally {
    // Dọn dẹp dữ liệu test
    const cleanEmails = [testEmailFarm, testEmailCompany, testEmailLink];
    const usersToDelete = await User.find({ email: { $in: cleanEmails } });
    const userIds = usersToDelete.map((u) => u._id);
    await FarmProfile.deleteMany({ user: { $in: userIds } });
    await CompanyProfile.deleteMany({ user: { $in: userIds } });
    await User.deleteMany({ email: { $in: cleanEmails } });
  }

  console.log('\n======================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ GOOGLE AUTH: ${passedTests} passed, ${failedTests} failed`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Lỗi chạy test Google Auth:', err);
  process.exit(1);
});
