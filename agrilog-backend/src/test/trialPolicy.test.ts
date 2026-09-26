import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { TrialSetting } from '../models/TrialSetting';
import { FarmProfile } from '../models/FarmProfile';
import {
  getOrCreateTrialSetting,
  getEffectivePlan,
  isPlanExpired,
  checkBoardLocked,
} from '../utils/boardUtils';
import { createDefaultFarmProfile } from '../controllers/farmProfileController';

console.log('🧪 Bắt đầu chạy bộ kiểm thử Trial Policy (Miễn phí X tháng, khóa khi hết hạn)...\n');

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
  await mongoose.connect(process.env.MONGO_URI as string);

  console.log('📌 1. Kiểm thử cấu hình chính sách Dùng thử mặc định:');
  await it('Khởi tạo TrialSetting mặc định có đủ các trường', async () => {
    const setting = await getOrCreateTrialSetting();
    assert.strictEqual(setting.isEnabled, true);
    assert.strictEqual(typeof setting.durationMonths, 'number');
    assert.strictEqual(setting.durationMonths >= 1, true);
    assert.strictEqual(setting.trialPlan, 'PREMIUM');
    assert.strictEqual(setting.lockOnExpiry, true);
  });

  console.log('\n📌 2. Kiểm thử cấp gói dùng thử cho tài khoản mới:');
  const testUserId = new mongoose.Types.ObjectId();
  await it('Tạo FarmProfile mới tự động nhận gói dùng thử PREMIUM trong X tháng', async () => {
    // Đảm bảo trial đang bật 2 tháng
    await TrialSetting.updateOne({}, { $set: { isEnabled: true, durationMonths: 2, trialPlan: 'PREMIUM' } });
    
    const profile = await createDefaultFarmProfile(testUserId, { farmName: 'Nông trại Thử Nghiệm' });
    assert.strictEqual(profile.plan, 'PREMIUM');
    assert.strictEqual(profile.isTrial, true);
    assert.ok(profile.planExpiresAt);
    
    // Kiểm tra thời hạn khoảng ~60 ngày
    const diffDays = Math.round((new Date(profile.planExpiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    assert.ok(diffDays >= 58 && diffDays <= 62);

    const effective = getEffectivePlan(profile);
    assert.strictEqual(effective, 'PREMIUM');
    assert.strictEqual(isPlanExpired(profile), false);
  });

  console.log('\n📌 3. Kiểm thử Khóa chức năng khi hết hạn dùng thử:');
  await it('Khi thời hạn dùng thử kết thúc, effectivePlan chuyển sang EXPIRED và bị khóa', async () => {
    const expiredProfile = {
      plan: 'PREMIUM',
      isTrial: true,
      planExpiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hôm qua
    };

    assert.strictEqual(isPlanExpired(expiredProfile), true);
    assert.strictEqual(getEffectivePlan(expiredProfile), 'EXPIRED');

    // Kiểm tra hàm checkBoardLocked
    const dummyProfileId = new mongoose.Types.ObjectId().toString();
    const dummyBoardId = new mongoose.Types.ObjectId().toString();
    const isLocked = await checkBoardLocked(dummyProfileId, dummyBoardId, 'EXPIRED');
    assert.strictEqual(isLocked, true);
  });

  console.log('\n📌 4. Kiểm thử tắt tính năng dùng thử:');
  await it('Khi Admin tắt Dùng thử (isEnabled: false), tài khoản mới tạo nhận gói FREE', async () => {
    await TrialSetting.updateOne({}, { $set: { isEnabled: false } });
    const noTrialUserId = new mongoose.Types.ObjectId();
    const noTrialProfile = await createDefaultFarmProfile(noTrialUserId, { farmName: 'Nông trại Không Trial' });

    assert.strictEqual(noTrialProfile.plan, 'FREE');
    assert.strictEqual(noTrialProfile.isTrial, false);
    assert.strictEqual(noTrialProfile.planExpiresAt, undefined);

    // Dọn dẹp
    await FarmProfile.deleteMany({ user: { $in: [testUserId, noTrialUserId] } });
    // Bật lại trial
    await TrialSetting.updateOne({}, { $set: { isEnabled: true, durationMonths: 1, trialPlan: 'PREMIUM' } });
  });

  await mongoose.disconnect();

  console.log(`\n========================================`);
  console.log(`🏁 Kết quả kiểm thử: ${passedTests} passed, ${failedTests} failed`);
  console.log(`========================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
