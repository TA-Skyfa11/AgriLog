import bcrypt from 'bcryptjs';
import { connectDB, getSql } from '../config/db';
import { User, Role } from '../models/User';
import { FarmProfile } from '../models/FarmProfile';
import { CompanyProfile } from '../models/CompanyProfile';
import { Material } from '../models/Material';
import { CultivationBoard } from '../models/CultivationBoard';
import { CultivationEntry } from '../models/CultivationEntry';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { FertilizerEntry } from '../models/FertilizerEntry';
import { PesticideBoard } from '../models/PesticideBoard';
import { PesticideEntry } from '../models/PesticideEntry';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Task } from '../models/Task';
import { Notification } from '../models/Notification';
import { ServicePackage } from '../models/ServicePackage';
import {
  seedTestFixtures,
  cleanupTestFixtures,
  generateTestToken,
  TEST_PASSWORD_PLAIN,
  TEST_FIXTURE_IDS,
} from './fixtures/testData';

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

async function runIntegrationWorkflows() {
  console.log('========================================================================');
  console.log('🌾 AGRILOG END-TO-END BUSINESS WORKFLOWS & FIXTURES INTEGRATION TEST 🌾');
  console.log('========================================================================\n');

  await connectDB();

  // --------------------------------------------------------------------------
  console.log('📦 GIAI ĐOẠN 1: Nạp bộ dữ liệu kiểm thử chuẩn (Seed Test Fixtures)...');
  // --------------------------------------------------------------------------
  await seedTestFixtures();
  const testUsersCount = await User.countDocuments({ _id: { $regex: '^test_' } });
  const testProductsCount = await Product.countDocuments({ _id: { $regex: '^test_' } });
  assert(testUsersCount >= 4, `Nạp thành công ${testUsersCount} tài khoản mẫu`);
  assert(testProductsCount >= 3, `Nạp thành công ${testProductsCount} sản phẩm vật tư mẫu`);

  // --------------------------------------------------------------------------
  console.log('\n🔐 GIAI ĐOẠN 2: Luồng Xác thực & Phân quyền Tài khoản:');
  // --------------------------------------------------------------------------
  // 1. Farmer Login
  const farmerUser = await User.findById(TEST_FIXTURE_IDS.FARM_USER_ID);
  assert(farmerUser !== null, 'Tìm thấy tài khoản Nông hộ test');
  const isFarmerMatch = await bcrypt.compare(TEST_PASSWORD_PLAIN, farmerUser!.passwordHash || '');
  assert(Boolean(isFarmerMatch), 'Mật khẩu Nông hộ mã hóa bcrypt khớp chính xác');
  assert(farmerUser!.role === Role.FARM, 'Tài khoản có quyền FARM chính xác');

  // 2. JWT Generation & Verification
  const token = generateTestToken(farmerUser!._id, farmerUser!.role);
  assert(typeof token === 'string' && token.split('.').length === 3, 'Sinh JWT Bearer Token hợp lệ chuẩn RFC 7519');

  // 3. Locked User Check
  const lockedUser = await User.findById(TEST_FIXTURE_IDS.LOCKED_USER_ID);
  assert(lockedUser !== null && lockedUser!.isActive === false, 'Tài khoản bị khóa có trạng thái isActive: false');

  // 4. Admin Account
  const adminUser = await User.findById(TEST_FIXTURE_IDS.ADMIN_USER_ID);
  assert(adminUser !== null && adminUser!.role === Role.ADMIN, 'Tài khoản Quản trị viên ADMIN sẵn sàng');

  // --------------------------------------------------------------------------
  console.log('\n📖 GIAI ĐOẠN 3: Luồng Quản lý Hồ sơ & Bảng Nhật ký Canh tác:');
  // --------------------------------------------------------------------------
  const farmProfile = await FarmProfile.findById(TEST_FIXTURE_IDS.FARM_PROFILE_ID);
  assert(farmProfile !== null && farmProfile!.areaSqm === 12000, 'Truy xuất hồ sơ nông trại với diện tích 12,000 m²');

  const cultBoard = await CultivationBoard.findById(TEST_FIXTURE_IDS.CULT_BOARD_ID);
  assert(cultBoard !== null && cultBoard!.cropName === 'Dau tay Nhat Ban', 'Truy xuất bảng canh tác Dâu tây Nhật Bản');

  // Query entries of the board
  const entries = await CultivationEntry.find({ cultivationBoard: cultBoard!._id }).sort({ date: 1 });
  assert(entries.length === 2, 'Tìm thấy 2 công đoạn canh tác (Làm đất & Xuống giống)');
  assert(entries[0].stage === 'Lam dat & len luong', 'Giai đoạn 1: Làm đất & lên luống');
  assert(entries[1].stage === 'Xuong giong', 'Giai đoạn 2: Xuống giống');

  // Thêm một nhật ký công đoạn mới
  const newEntry = await CultivationEntry.create({
    _id: 'test_cult_entry_003',
    cultivationBoard: cultBoard!._id,
    date: new Date('2026-10-08T08:00:00.000Z'),
    stage: 'Cham soc dot 1',
    action: 'Tuoi phan bon la vi luong SuperMicro',
    notes: 'Cay phat trien dong deu, khong co sau benh'
  });
  assert(newEntry._id === 'test_cult_entry_003', 'Ghi thêm công đoạn chăm sóc thành công');

  const updatedEntriesCount = await CultivationEntry.countDocuments({ cultivationBoard: cultBoard!._id });
  assert(updatedEntriesCount === 3, 'Tổng số công đoạn canh tác cập nhật lên 3');

  // --------------------------------------------------------------------------
  console.log('\n🧪 GIAI ĐOẠN 4: Luồng Bón phân & An toàn Phun thuốc BVTV:');
  // --------------------------------------------------------------------------
  const fertEntry = await FertilizerEntry.findById(TEST_FIXTURE_IDS.FERT_ENTRY_ID);
  assert(fertEntry !== null && Number(fertEntry!.amount) === 100, 'Ghi nhận lượng bón lót: 100 kg phân hữu cơ');

  const pestEntry = await PesticideEntry.findById(TEST_FIXTURE_IDS.PEST_ENTRY_ID);
  assert(pestEntry !== null && pestEntry!.quarantineDays === 3, 'Xác định thời gian cách ly thuốc BVTV là 3 ngày');
  
  // Calculate quarantine safety
  const sprayDate = new Date(pestEntry!.date);
  const safeDate = new Date(pestEntry!.safeHarvestDate);
  const diffDays = Math.round((safeDate.getTime() - sprayDate.getTime()) / (1000 * 60 * 60 * 24));
  assert(diffDays === 3, `Thời gian cách ly chuẩn xác: ${diffDays} ngày kể từ ngày phun`);

  // --------------------------------------------------------------------------
  console.log('\n🏭 GIAI ĐOẠN 5: Luồng Quản lý Kho Vật tư & Trừ Tồn kho:');
  // --------------------------------------------------------------------------
  const fertMat = await Material.findById(TEST_FIXTURE_IDS.FERT_MAT_ID);
  assert(fertMat !== null && Number(fertMat!.quantity) === 500, 'Tồn kho ban đầu của phân Trichoderma: 500 kg');

  // Trừ 50kg xuất kho
  await Material.updateOne(
    { _id: TEST_FIXTURE_IDS.FERT_MAT_ID },
    { $inc: { quantity: -50 } }
  );
  const reloadedMat = await Material.findById(TEST_FIXTURE_IDS.FERT_MAT_ID);
  assert(Number(reloadedMat!.quantity) === 450, 'Sau khi sử dụng 50kg, tồn kho thực tế giảm xuống còn 450 kg');

  // --------------------------------------------------------------------------
  console.log('\n🛒 GIAI ĐOẠN 6: Luồng Sàn Thương mại, Đơn hàng & Hoa hồng:');
  // --------------------------------------------------------------------------
  const products = await Product.find({ company: TEST_FIXTURE_IDS.COMPANY_PROFILE_ID, status: 'ACTIVE' });
  assert(products.length === 3, 'Doanh nghiệp niêm yết thành công 3 sản phẩm trên Sàn');

  const order = await Order.findById(TEST_FIXTURE_IDS.ORDER_ID);
  assert(order !== null, 'Tìm thấy đơn đặt hàng mẫu của Nông hộ');
  assert(Number(order!.totalAmount) === 530000, 'Tổng giá trị đơn hàng: 530,000 VNĐ');

  // Verify Commission 5%
  const expectedCommission = Number(order!.totalAmount) * 0.05;
  assert(Number(order!.commissionFee) === expectedCommission, `Hoa hồng sàn 5% tính toán chính xác: ${expectedCommission} VNĐ`);

  // State Transition: PENDING -> CONFIRMED -> SHIPPING -> DELIVERED
  await Order.updateOne({ _id: order!._id }, { $set: { status: 'CONFIRMED' } });
  let checkOrder = await Order.findById(order!._id);
  assert(checkOrder?.status === 'CONFIRMED', 'Đơn hàng chuyển sang trạng thái CONFIRMED (Đã xác nhận)');

  await Order.updateOne({ _id: order!._id }, { $set: { status: 'DELIVERED' } });
  checkOrder = await Order.findById(order!._id);
  assert(checkOrder?.status === 'DELIVERED', 'Đơn hàng hoàn tất giao thành công DELIVERED');

  // --------------------------------------------------------------------------
  console.log('\n📅 GIAI ĐOẠN 7: Luồng Lịch Nông vụ & Thông báo Nhắc việc:');
  // --------------------------------------------------------------------------
  const pendingTasks = await Task.find({
    farmProfile: TEST_FIXTURE_IDS.FARM_PROFILE_ID,
    status: 'PENDING'
  });
  assert(pendingTasks.length === 2, 'Lọc chính xác 2 công việc chưa hoàn thành');

  // Hoàn thành 1 công việc
  await Task.updateOne(
    { _id: TEST_FIXTURE_IDS.TASK_1_ID },
    { $set: { status: 'COMPLETED' } }
  );
  const completedTask = await Task.findById(TEST_FIXTURE_IDS.TASK_1_ID);
  assert(completedTask?.status === 'COMPLETED', 'Cập nhật trạng thái công việc thành COMPLETED');

  // Kiểm tra thông báo hệ thống
  const notif = await Notification.findById(TEST_FIXTURE_IDS.NOTIF_ID);
  assert(notif !== null && notif!.isRead === false, 'Thông báo chào mừng được gửi tới người dùng');
  
  await Notification.updateOne({ _id: notif!._id }, { $set: { isRead: true } });
  const readNotif = await Notification.findById(notif!._id);
  assert(readNotif?.isRead === true, 'Đánh dấu đã đọc thông báo thành công');

  // --------------------------------------------------------------------------
  console.log('\n💎 GIAI ĐOẠN 8: Gói cước Dịch vụ (Service Packages):');
  // --------------------------------------------------------------------------
  const packages = await ServicePackage.find({ isActive: true });
  assert(packages.length >= 3, 'Hệ thống có đủ 3 gói dịch vụ (FREE, STANDARD, PREMIUM)');

  // --------------------------------------------------------------------------
  console.log('\n🧹 GIAI ĐOẠN 9: Dọn dẹp dữ liệu kiểm thử (Cleanup Fixtures)...');
  // --------------------------------------------------------------------------
  await cleanupTestFixtures();
  const remainingTestUsers = await User.countDocuments({ _id: { $regex: '^test_' } });
  assert(remainingTestUsers === 0, 'Dọn dẹp sạch sẽ toàn bộ các bản ghi kiểm thử test_*');

  console.log('\n========================================================================');
  console.log(`🏁 Tổng kết kiểm thử tích hợp: ${passed} passed, ${failed} failed`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runIntegrationWorkflows().catch((err) => {
  console.error('❌ Lỗi kiểm thử tích hợp:', err);
  process.exit(1);
});
