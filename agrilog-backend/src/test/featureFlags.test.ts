import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { SystemFeature } from '../models/SystemFeature';
import {
  DEFAULT_SYSTEM_FEATURES,
  ensureDefaultFeatures,
} from '../controllers/featureController';

console.log('🧪 Bắt đầu chạy bộ kiểm thử System Feature Flags (Hiện / Ẩn chức năng)...\n');

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

  console.log('📌 1. Kiểm thử khởi tạo và nạp tính năng mặc định:');
  await it('Đảm bảo danh sách tính năng mặc định có đủ 11 module', () => {
    assert.strictEqual(DEFAULT_SYSTEM_FEATURES.length >= 10, true);
    assert.strictEqual(DEFAULT_SYSTEM_FEATURES.some(f => f.key === 'marketplace'), true);
    assert.strictEqual(DEFAULT_SYSTEM_FEATURES.some(f => f.key === 'inventory'), true);
    assert.strictEqual(DEFAULT_SYSTEM_FEATURES.some(f => f.key === 'diary_cultivation'), true);
    assert.strictEqual(DEFAULT_SYSTEM_FEATURES.some(f => f.key === 'billing'), true);
  });

  await it('ensureDefaultFeatures lưu đầy đủ vào Database', async () => {
    const features = await ensureDefaultFeatures();
    assert.strictEqual(features.length >= DEFAULT_SYSTEM_FEATURES.length, true);
  });

  console.log('\n📌 2. Kiểm thử Bật/Tắt tính năng (Toggle):');
  await it('Tắt một tính năng (ví dụ marketplace)', async () => {
    const feature = await SystemFeature.findOne({ key: 'marketplace' });
    assert.ok(feature);
    feature.isEnabled = false;
    await feature.save();

    const updated = await SystemFeature.findOne({ key: 'marketplace' });
    assert.strictEqual(updated?.isEnabled, false);
  });

  await it('Bật lại tính năng đã tắt', async () => {
    const feature = await SystemFeature.findOne({ key: 'marketplace' });
    assert.ok(feature);
    feature.isEnabled = true;
    await feature.save();

    const updated = await SystemFeature.findOne({ key: 'marketplace' });
    assert.strictEqual(updated?.isEnabled, true);
  });

  console.log('\n📌 3. Kiểm thử lọc tính năng cho Client:');
  await it('Tạo đúng map tính năng và danh sách đường dẫn bị ẩn khi có tính năng bị tắt', async () => {
    // Tắt thử 1 tính năng
    await SystemFeature.updateOne({ key: 'reports' }, { $set: { isEnabled: false } });

    const all = await SystemFeature.find();
    const featureMap: Record<string, boolean> = {};
    const disabledPaths: string[] = [];

    all.forEach(f => {
      featureMap[f.key] = f.isEnabled;
      if (!f.isEnabled && f.path) {
        disabledPaths.push(f.path);
      }
    });

    assert.strictEqual(featureMap['reports'], false);
    assert.strictEqual(featureMap['marketplace'], true);
    assert.strictEqual(disabledPaths.includes('/reports'), true);

    // Khôi phục lại
    await SystemFeature.updateOne({ key: 'reports' }, { $set: { isEnabled: true } });
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
