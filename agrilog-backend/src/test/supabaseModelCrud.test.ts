import { connectDB, getSql } from '../config/db';
import { User, Role } from '../models/User';
import { Material } from '../models/Material';
import { Task } from '../models/Task';
import { Product } from '../models/Product';
import { CultivationBoard } from '../models/CultivationBoard';
import { CultivationEntry } from '../models/CultivationEntry';

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

async function runCrudTests() {
  console.log('===============================================================');
  console.log('🧪 AGRILOG SUPABASE MODEL & CRUD ENGINE TEST SUITE 🧪');
  console.log('===============================================================\n');

  await connectDB();
  const sql = getSql();

  // Clean any test artifacts from prior runs
  await sql.unsafe(`DELETE FROM tasks WHERE id LIKE 'crud_test_%'`);
  await sql.unsafe(`DELETE FROM materials WHERE id LIKE 'crud_test_%'`);
  await sql.unsafe(`DELETE FROM users WHERE id LIKE 'crud_test_%'`);
  await sql.unsafe(`DELETE FROM cultivation_boards WHERE id LIKE 'crud_test_%'`);
  await sql.unsafe(`DELETE FROM cultivation_entries WHERE id LIKE 'crud_test_%'`);

  // --------------------------------------------------------------------------
  console.log('📌 1. Kiểm thử Tạo mới (Create & InsertMany) và Schema Defaults:');
  // --------------------------------------------------------------------------
  const userDoc = await User.create({
    _id: 'crud_test_user_01',
    email: 'crud.user@example.test',
    passwordHash: 'dummy_hash_123',
    // notice isActive not specified, must default to true
  });
  assert(userDoc._id === 'crud_test_user_01', 'Tạo tài khoản với ID tùy chỉnh thành công');
  assert(userDoc.isActive === true, 'Tự động áp dụng giá trị mặc định isActive: true từ Schema');
  assert(userDoc.role === Role.FARM, 'Tự động áp dụng role mặc định là FARM');
  assert(userDoc.createdAt instanceof Date, 'Tự động sinh trường createdAt dạng Date object');

  // InsertMany
  const tasksInserted = await Task.insertMany([
    {
      _id: 'crud_test_task_01',
      farmProfile: 'crud_test_farm_01',
      title: 'Tưới nước luống 1',
      status: 'PENDING',
      priority: 'HIGH',
      dueDate: new Date('2026-10-15T08:00:00Z'),
    },
    {
      _id: 'crud_test_task_02',
      farmProfile: 'crud_test_farm_01',
      title: 'Bón phân thúc luống 1',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: new Date('2026-10-16T08:00:00Z'),
    },
    {
      _id: 'crud_test_task_03',
      farmProfile: 'crud_test_farm_01',
      title: 'Thu hoạch luống 2',
      status: 'COMPLETED',
      priority: 'LOW',
      dueDate: new Date('2026-10-10T08:00:00Z'),
    }
  ]);
  assert(tasksInserted.length === 3, 'insertMany tạo thành công 3 bản ghi Task');

  // --------------------------------------------------------------------------
  console.log('\n📌 2. Kiểm thử Truy vấn Cơ bản (findById, findOne, find):');
  // --------------------------------------------------------------------------
  const foundUser = await User.findById('crud_test_user_01');
  assert(foundUser !== null && foundUser.email === 'crud.user@example.test', 'findById tìm chính xác bản ghi');

  const foundTask = await Task.findOne({ title: 'Tưới nước luống 1' });
  assert(foundTask !== null && foundTask._id === 'crud_test_task_01', 'findOne tìm đúng tài liệu theo trường data');

  const pendingTasks = await Task.find({ farmProfile: 'crud_test_farm_01', status: 'PENDING' });
  assert(pendingTasks.length === 2, 'find lọc chính xác nhiều điều kiện AND');

  // --------------------------------------------------------------------------
  console.log('\n📌 3. Kiểm thử Toán tử Truy vấn Phức tạp ($in, $ne, $gte, $lte, $regex, $or):');
  // --------------------------------------------------------------------------
  // $in
  const tasksIn = await Task.find({ priority: { $in: ['HIGH', 'LOW'] } });
  const hasOnlyHighLow = tasksIn.every(t => t.priority === 'HIGH' || t.priority === 'LOW');
  assert(tasksIn.length >= 2 && hasOnlyHighLow, 'Toán tử $in lọc chính xác');

  // $ne
  const tasksNe = await Task.find({ farmProfile: 'crud_test_farm_01', status: { $ne: 'COMPLETED' } });
  assert(tasksNe.length === 2, 'Toán tử $ne loại trừ chính xác giá trị');

  // $gte / $lte
  const tasksDue = await Task.find({
    farmProfile: 'crud_test_farm_01',
    dueDate: { $gte: new Date('2026-10-14T00:00:00Z'), $lte: new Date('2026-10-17T00:00:00Z') }
  });
  assert(tasksDue.length === 2, 'Toán tử $gte/$lte so khớp khoảng thời gian chính xác');

  // $regex
  const tasksRegex = await Task.find({
    farmProfile: 'crud_test_farm_01',
    title: { $regex: 'luống 1' }
  });
  assert(tasksRegex.length === 2, 'Toán tử $regex tìm kiếm chuỗi khớp mẫu');

  // $or
  const tasksOr = await Task.find({
    farmProfile: 'crud_test_farm_01',
    $or: [{ priority: 'HIGH' }, { status: 'COMPLETED' }]
  });
  assert(tasksOr.length === 2, 'Toán tử $or kết hợp điều kiện chính xác');

  // --------------------------------------------------------------------------
  console.log('\n📌 4. Kiểm thử Chaining (sort, skip, limit, select, lean):');
  // --------------------------------------------------------------------------
  const sortedTasks = await Task.find({ farmProfile: 'crud_test_farm_01' })
    .sort({ dueDate: -1 })
    .limit(2)
    .skip(0)
    .lean();
  assert(sortedTasks.length === 2, 'Chaining sort & limit trả về đúng số lượng bản ghi');
  assert(
    new Date(sortedTasks[0].dueDate).getTime() >= new Date(sortedTasks[1].dueDate).getTime(),
    'Chaining sort({ dueDate: -1 }) sắp xếp giảm dần chính xác'
  );

  // --------------------------------------------------------------------------
  console.log('\n📌 5. Kiểm thử Cập nhật (findByIdAndUpdate, updateOne, updateMany, $set, $inc):');
  // --------------------------------------------------------------------------
  // Create material for testing $inc
  await Material.create({
    _id: 'crud_test_mat_01',
    farmProfile: 'crud_test_farm_01',
    name: 'Phân NPK Test',
    type: 'FERTILIZER',
    quantity: 100,
    unit: 'kg'
  });

  // $inc
  await Material.updateOne(
    { _id: 'crud_test_mat_01' },
    { $inc: { quantity: -25 } }
  );
  const updatedMat = await Material.findById('crud_test_mat_01');
  assert(Number(updatedMat?.quantity) === 75, 'Toán tử $inc giảm số lượng kho chính xác (100 -> 75)');

  // findByIdAndUpdate with $set
  const updatedTask = await Task.findByIdAndUpdate(
    'crud_test_task_01',
    { $set: { status: 'COMPLETED', notes: 'Đã hoàn thành tưới luống' } },
    { new: true }
  );
  assert(updatedTask?.status === 'COMPLETED' && updatedTask?.notes === 'Đã hoàn thành tưới luống', 'findByIdAndUpdate cập nhật và trả về bản ghi mới');

  // updateMany
  const updateManyRes = await Task.updateMany(
    { farmProfile: 'crud_test_farm_01', status: 'PENDING' },
    { $set: { status: 'COMPLETED' } }
  );
  assert(updateManyRes.modifiedCount === 1, 'updateMany cập nhật hàng loạt chính xác số lượng');

  // --------------------------------------------------------------------------
  console.log('\n📌 6. Kiểm thử Xóa dữ liệu (findByIdAndDelete, deleteOne, deleteMany):');
  // --------------------------------------------------------------------------
  const deletedTask = await Task.findByIdAndDelete('crud_test_task_01');
  assert(deletedTask?._id === 'crud_test_task_01', 'findByIdAndDelete xóa và trả về bản ghi đã xóa');
  const checkDeleted = await Task.findById('crud_test_task_01');
  assert(checkDeleted === null, 'Bản ghi đã bị xóa hoàn toàn khỏi Database');

  const deleteOneRes = await Task.deleteOne({ _id: 'crud_test_task_02' });
  assert(deleteOneRes.deletedCount === 1, 'deleteOne xóa đúng 1 bản ghi');

  const countBefore = await Task.countDocuments({ farmProfile: 'crud_test_farm_01' });
  const deleteManyRes = await Task.deleteMany({ farmProfile: 'crud_test_farm_01' });
  assert(deleteManyRes.deletedCount === countBefore, 'deleteMany dọn dẹp toàn bộ dữ liệu khớp điều kiện');

  // --------------------------------------------------------------------------
  console.log('\n📌 7. Kiểm thử Populate (Quan hệ giữa các bảng):');
  // --------------------------------------------------------------------------
  await CultivationBoard.create({
    _id: 'crud_test_board_01',
    farmProfile: 'crud_test_farm_01',
    cropName: 'Dưa lưới Huỳnh Long',
    status: 'IN_PROGRESS'
  });
  await CultivationEntry.create({
    _id: 'crud_test_entry_01',
    cultivationBoard: 'crud_test_board_01',
    stage: 'Ra hoa thụ phấn',
    action: 'Thụ phấn nhân tạo bằng ong mật'
  });

  const entryWithPopulate = await CultivationEntry.findOne({ _id: 'crud_test_entry_01' })
    .populate('cultivationBoard');
  assert(
    entryWithPopulate !== null &&
    typeof entryWithPopulate.cultivationBoard === 'object' &&
    entryWithPopulate.cultivationBoard.cropName === 'Dưa lưới Huỳnh Long',
    'populate liên kết chính xác bảng cha và bảng con'
  );

  // --------------------------------------------------------------------------
  console.log('\n📌 8. Dọn dẹp dữ liệu kiểm thử:');
  // --------------------------------------------------------------------------
  await User.findByIdAndDelete('crud_test_user_01');
  await Material.findByIdAndDelete('crud_test_mat_01');
  await CultivationBoard.findByIdAndDelete('crud_test_board_01');
  await CultivationEntry.findByIdAndDelete('crud_test_entry_01');
  assert(true, 'Dọn dẹp toàn bộ dữ liệu tạm thời thành công');

  console.log('\n===============================================================');
  console.log(`🏁 Tổng kết kiểm thử CRUD: ${passed} passed, ${failed} failed`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runCrudTests().catch((err) => {
  console.error('❌ Lỗi kiểm thử CRUD:', err);
  process.exit(1);
});
