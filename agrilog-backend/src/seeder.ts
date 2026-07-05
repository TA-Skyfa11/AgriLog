import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User, Role } from './models/User';
import { FarmProfile } from './models/FarmProfile';
import { connectDB } from './config/db';
import { CultivationBoard } from './models/CultivationBoard';
import { CultivationEntry } from './models/CultivationEntry';
import { FertilizerBoard } from './models/FertilizerBoard';
import { FertilizerEntry } from './models/FertilizerEntry';
import { PesticideBoard } from './models/PesticideBoard';
import { PesticideEntry } from './models/PesticideEntry';
import { Material } from './models/Material';
import { Task } from './models/Task';

dotenv.config();

const importData = async () => {
  try {
    await connectDB();

    // Xóa dữ liệu cũ
    await User.deleteMany();
    await FarmProfile.deleteMany();
    await CultivationBoard.deleteMany();
    await CultivationEntry.deleteMany();
    await FertilizerBoard.deleteMany();
    await FertilizerEntry.deleteMany();
    await PesticideBoard.deleteMany();
    await PesticideEntry.deleteMany();
    await Material.deleteMany();
    await Task.deleteMany();

    console.log('Đã xóa toàn bộ dữ liệu cũ...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    // Tạo Admin
    const admin = await User.create({
      email: 'admin@agrilog.com',
      passwordHash,
      role: Role.ADMIN,
    });
    console.log(`Đã tạo tài khoản Admin: ${admin.email} | Mật khẩu: 123456`);

    // Tạo Farm
    const farm = await User.create({
      email: 'farm@agrilog.com',
      passwordHash,
      role: Role.FARM,
    });
    console.log(`Đã tạo tài khoản Farm: ${farm.email} | Mật khẩu: 123456`);

    // Tạo Farm Profile
    const farmProfile = await FarmProfile.create({
      user: farm._id,
      farmName: 'Nông trại Xanh Hưng Yên',
      address: 'Văn Giang, Hưng Yên',
      areaSqm: 5000,
      mainCropType: 'Nhãn lồng',
      contactPhone: '0987654321',
      plan: 'BASIC',
    });
    console.log(`Đã tạo Hồ sơ Nông trại cho Farm`);

    // 1. Tạo Vật tư (Materials)
    const fertilizer1 = await Material.create({ farmProfile: farmProfile._id, name: 'Phân NPK 16-16-8', type: 'FERTILIZER', unit: 'kg', quantity: 500, minQuantityAlert: 50 });
    const fertilizer2 = await Material.create({ farmProfile: farmProfile._id, name: 'Phân Hữu cơ vi sinh', type: 'FERTILIZER', unit: 'kg', quantity: 1000, minQuantityAlert: 100 });
    const pesticide1 = await Material.create({ farmProfile: farmProfile._id, name: 'Thuốc trừ sâu Radiant', type: 'PESTICIDE', unit: 'ml', quantity: 2000, minQuantityAlert: 200 });
    console.log(`Đã tạo dữ liệu kho vật tư (Materials)`);

    // 2. Tạo Bảng Nhật ký (Boards)
    const cBoard = await CultivationBoard.create({ farmProfile: farmProfile._id, name: 'Khu A - Cà chua Thu Đông', cropType: 'Cà chua', areaSqm: 1000, startDate: new Date('2026-06-01'), status: 'ACTIVE' });
    const fBoard = await FertilizerBoard.create({ farmProfile: farmProfile._id, name: 'Khu A - Bón phân Cà chua', cropType: 'Cà chua', areaSqm: 1000, startDate: new Date('2026-06-01'), status: 'ACTIVE' });
    const pBoard = await PesticideBoard.create({ farmProfile: farmProfile._id, name: 'Khu A - Phun thuốc Cà chua', cropType: 'Cà chua', areaSqm: 1000, startDate: new Date('2026-06-01'), status: 'ACTIVE' });
    console.log(`Đã tạo các bảng nhật ký (Boards)`);

    // 3. Tạo Entries cho các Bảng
    await CultivationEntry.create({ cultivationBoard: cBoard._id, date: new Date('2026-06-02'), activityName: 'Làm đất, lên luống', notes: 'Đất tơi xốp, bón lót phân chuồng' });
    await CultivationEntry.create({ cultivationBoard: cBoard._id, date: new Date('2026-06-05'), activityName: 'Xuống giống', notes: 'Giống cà chua lai F1' });
    
    await FertilizerEntry.create({ fertilizerBoard: fBoard._id, date: new Date('2026-06-15'), material: fertilizer1._id, materialName: fertilizer1.name, quantity: 20, unit: 'kg', notes: 'Bón thúc lần 1' });
    await FertilizerEntry.create({ fertilizerBoard: fBoard._id, date: new Date('2026-07-01'), material: fertilizer2._id, materialName: fertilizer2.name, quantity: 50, unit: 'kg', notes: 'Bón thúc lần 2' });

    await PesticideEntry.create({ pesticideBoard: pBoard._id, date: new Date('2026-06-20'), material: pesticide1._id, materialName: pesticide1.name, quantity: 150, unit: 'ml', phiDays: 7, notes: 'Phòng trừ sâu vẽ bùa' });
    console.log(`Đã tạo dữ liệu ghi chép nhật ký (Entries)`);

    // 4. Tạo Lịch công việc (Tasks)
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
    
    await Task.create({ farmProfile: farmProfile._id, title: 'Tưới nước khu A', dueDate: today, status: 'PENDING', notes: 'Tưới đẫm vào buổi sáng' });
    await Task.create({ farmProfile: farmProfile._id, title: 'Kiểm tra bọ trĩ', dueDate: tomorrow, status: 'PENDING' });
    await Task.create({ farmProfile: farmProfile._id, title: 'Bón phân NPK đợt 3', dueDate: nextWeek, status: 'PENDING', notes: 'Chuẩn bị 30kg NPK' });
    await Task.create({ farmProfile: farmProfile._id, title: 'Thu dọn cỏ dại', dueDate: today, status: 'COMPLETED' });
    console.log(`Đã tạo dữ liệu Lịch công việc (Tasks)`);

    console.log('Dữ liệu mẫu đã được tạo thành công!');
    process.exit();
  } catch (error) {
    console.error(`Lỗi tạo dữ liệu mẫu: ${(error as Error).message}`);
    process.exit(1);
  }
};

importData();
