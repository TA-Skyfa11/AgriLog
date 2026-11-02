import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB, sql } from '../config/db';
import { Types } from '../models/supabaseModel';
import { User, Role } from '../models/User';
import { FarmProfile } from '../models/FarmProfile';
import { CultivationBoard } from '../models/CultivationBoard';
import { TrialSetting } from '../models/TrialSetting';
import { createDefaultFarmProfile } from '../controllers/farmProfileController';
import { createCultivationBoard } from '../controllers/cultivationController';
import { getOrCreateTrialSetting } from '../utils/boardUtils';

console.log('🧪 Bắt đầu kiểm thử tính năng: Chống spam tạo bảng & Tự động cấp gói cước khi lập tài khoản...\n');

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
  await connectDB();

  console.log('📌 1. Kiểm thử gói cước mặc định cho tài khoản mới (Mặc định là PREMIUM - gói cao nhất):');
  const testUserId = new Types.ObjectId();
  await it('Tài khoản mới tạo tự động nhận gói PREMIUM mà không cần chọn hay thanh toán', async () => {
    // Đảm bảo cấu hình trial mặc định
    await TrialSetting.deleteMany({});
    const setting = await getOrCreateTrialSetting();
    assert.strictEqual(setting.trialPlan, 'PREMIUM', 'Trial setting mặc định là gói cao nhất (PREMIUM)');

    const profile = await createDefaultFarmProfile(testUserId, { farmName: 'Nông trại Test Auto Plan' });
    assert.strictEqual(profile.plan, 'PREMIUM', 'Hồ sơ nông trại tự động nhận gói PREMIUM');
    assert.strictEqual(profile.isTrial, true, 'Hồ sơ được đánh dấu dùng thử miễn phí');
    assert.ok(profile.planExpiresAt, 'Có hạn dùng');
  });

  console.log('\n📌 2. Kiểm thử chống spam tạo bảng (Chỉ tạo 1 bảng khi gửi yêu cầu dồn dập):');
  await it('Gửi nhiều request tạo bảng cùng lúc chỉ tạo đúng 1 bảng, các request sau trả về 429 hoặc bảng trùng lặp', async () => {
    const user = await User.create({
      name: 'Nông dân Test Spam',
      phone: '0988776655',
      passwordHash: 'dummy',
      role: Role.FARM,
    });
    const profile = await createDefaultFarmProfile(user._id, { farmName: 'Nông trại Test Spam' });

    const responses: any[] = [];
    const makeReq = () => {
      const req: any = {
        user: { _id: user._id, role: Role.FARM },
        body: {
          name: 'Bảng Thử Nghiệm Chống Spam',
          cropType: 'Lúa Nước',
          areaSqm: 1000,
          startDate: '2026-10-31',
        },
      };
      let resStatus = 200;
      let resData: any = null;
      const res: any = {
        status: (code: number) => {
          resStatus = code;
          return res;
        },
        json: (data: any) => {
          resData = data;
          return res;
        },
      };

      return createCultivationBoard(req, res).then(() => ({ status: resStatus, data: resData }));
    };

    // Gửi đồng thời 3 request tạo bảng giống nhau
    const results = await Promise.all([makeReq(), makeReq(), makeReq()]);

    // Đếm số lượng bảng canh tác thực tế được lưu trong DB
    const boards = await CultivationBoard.find({
      farmProfile: profile._id,
      name: 'Bảng Thử Nghiệm Chống Spam',
    });

    assert.strictEqual(boards.length, 1, 'Chỉ đúng 1 bảng canh tác được tạo ra trong DB!');

    // Ít nhất 1 request thành công 201 hoặc 200 (deduplicated)
    const successRes = results.filter(r => r.status === 201 || r.status === 200);
    assert.ok(successRes.length >= 1, 'Có ít nhất 1 request xử lý thành công');

    // Dọn dẹp
    await CultivationBoard.deleteMany({ farmProfile: profile._id });
    await FarmProfile.deleteMany({ user: user._id });
    await User.deleteMany({ _id: user._id });
  });

  // Dọn dẹp profile test 1
  await FarmProfile.deleteMany({ user: testUserId });
  await sql.end();

  console.log(`\n======================================================`);
  console.log(`🏁 Kết quả kiểm thử: ${passedTests} passed, ${failedTests} failed`);
  console.log(`======================================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('❌ Lỗi chạy test:', err);
  process.exit(1);
});
