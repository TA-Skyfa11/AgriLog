import { connectDB } from './config/db';
import { ServicePackage } from './models/ServicePackage';

export const SERVICE_PACKAGES_DATA = [
  {
    code: 'BASIC',
    name: 'Gói Cơ Bản (Basic)',
    price: 99000,
    description: 'Phù hợp cho nông hộ quy mô nhỏ, canh tác từ 1 - 3 thửa ruộng hoặc vườn cây gia đình.',
    features: [
      'Tạo tối đa 3 bảng nhật ký canh tác',
      'Ghi chép nhật ký bón phân & thuốc BVTV',
      'Theo dõi tồn kho vật tư nông nghiệp',
      'Dự báo thời tiết địa phương 7 ngày',
      'Lưu trữ tối đa 50 hình ảnh minh chứng',
      'Thời gian lưu trữ dữ liệu 1 năm'
    ],
    maxBoards: 3,
    maxImages: 50,
    isActive: true
  },
  {
    code: 'STANDARD',
    name: 'Gói Tiêu Chuẩn (Standard)',
    price: 199000,
    description: 'Dành cho trang trại chuyên nghiệp, hợp tác xã quy mô vừa cần quản lý nông vụ và xuất báo cáo.',
    features: [
      'Tạo tối đa 10 bảng nhật ký canh tác',
      'Đầy đủ tính năng bón phân, BVTV & tính ngày cách ly',
      'Quản lý lịch công việc & nhắc hạn tự động qua Zalo/OneSignal',
      'Xuất báo cáo nhật ký PDF/Excel chuẩn VietGAP',
      'Lưu trữ tối đa 200 hình ảnh hiện trường',
      'Thời gian lưu trữ dữ liệu 2 năm',
      'Hỗ trợ kỹ thuật ưu tiên'
    ],
    maxBoards: 10,
    maxImages: 200,
    isActive: true
  },
  {
    code: 'PREMIUM',
    name: 'Gói Cao Cấp (Premium)',
    price: 499000,
    description: 'Giải pháp toàn diện cho doanh nghiệp nông nghiệp, xuất khẩu và trang trại hữu cơ quy mô lớn.',
    features: [
      'Không giới hạn số lượng bảng nhật ký canh tác (lên đến 50 bảng)',
      'Toàn bộ tính năng VietGAP/GlobalGAP cao cấp',
      'Kết nối Sàn thương mại điện tử AgriLog Market',
      'Phân tích chi phí vật tư và thống kê lợi nhuận vụ mùa',
      'Lưu trữ không giới hạn hình ảnh (lên đến 1.000 ảnh)',
      'Thời gian lưu trữ dữ liệu vĩnh viễn (3+ năm)',
      'Hỗ trợ chuyên gia tư vấn kỹ thuật nông nghiệp 24/7'
    ],
    maxBoards: 50,
    maxImages: 1000,
    isActive: true
  }
];

export async function seedServicePackages() {
  console.log('🌱 Bắt đầu nạp dữ liệu các gói dịch vụ (BASIC, STANDARD, PREMIUM) vào Supabase...');
  await connectDB();

  for (const pkg of SERVICE_PACKAGES_DATA) {
    const existing = await ServicePackage.findOne({ code: pkg.code });
    if (existing) {
      existing.name = pkg.name;
      existing.price = pkg.price;
      existing.description = pkg.description;
      existing.features = pkg.features;
      existing.maxBoards = pkg.maxBoards;
      existing.maxImages = pkg.maxImages;
      existing.isActive = pkg.isActive;
      await existing.save();
      console.log(`  🔄 Cập nhật gói dịch vụ: ${pkg.code} - ${pkg.name} (${pkg.price.toLocaleString('vi-VN')} VNĐ)`);
    } else {
      await ServicePackage.create(pkg);
      console.log(`  ✨ Tạo mới gói dịch vụ: ${pkg.code} - ${pkg.name} (${pkg.price.toLocaleString('vi-VN')} VNĐ)`);
    }
  }

  const allPackages = await ServicePackage.find().sort({ price: 1 });
  console.log(`\n✅ Nạp dữ liệu hoàn tất! Hiện có ${allPackages.length} gói dịch vụ trong cơ sở dữ liệu:`);
  for (const p of allPackages) {
    console.log(`   • [${p.code}] ${p.name}: ${Number(p.price).toLocaleString('vi-VN')} VNĐ/tháng | ${p.features.length} tính năng | Tối đa ${p.maxBoards} bảng`);
  }
}

if (require.main === module) {
  seedServicePackages()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Lỗi nạp gói dịch vụ:', err);
      process.exit(1);
    });
}
