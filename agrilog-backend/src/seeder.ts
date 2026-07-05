import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User, Role } from './models/User';
import { FarmProfile } from './models/FarmProfile';
import { connectDB } from './config/db';

dotenv.config();

const importData = async () => {
  try {
    await connectDB();

    // Xóa dữ liệu cũ
    await User.deleteMany();
    await FarmProfile.deleteMany();

    console.log('Đã xóa dữ liệu cũ...');

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
    await FarmProfile.create({
      user: farm._id,
      farmName: 'Nông trại Xanh Hưng Yên',
      address: 'Văn Giang, Hưng Yên',
      areaSqm: 5000,
      mainCropType: 'Nhãn lồng',
      contactPhone: '0987654321',
    });
    console.log(`Đã tạo Hồ sơ Nông trại cho Farm`);

    console.log('Dữ liệu mẫu đã được tạo thành công!');
    process.exit();
  } catch (error) {
    console.error(`Lỗi tạo dữ liệu mẫu: ${(error as Error).message}`);
    process.exit(1);
  }
};

importData();
