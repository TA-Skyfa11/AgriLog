"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("./models/User");
const FarmProfile_1 = require("./models/FarmProfile");
const Cooperative_1 = require("./models/Cooperative");
const db_1 = require("./config/db");
const CultivationBoard_1 = require("./models/CultivationBoard");
const CultivationEntry_1 = require("./models/CultivationEntry");
const FertilizerBoard_1 = require("./models/FertilizerBoard");
const FertilizerEntry_1 = require("./models/FertilizerEntry");
const PesticideBoard_1 = require("./models/PesticideBoard");
const PesticideEntry_1 = require("./models/PesticideEntry");
const Material_1 = require("./models/Material");
const Task_1 = require("./models/Task");
const ServicePackage_1 = require("./models/ServicePackage");
const seedServicePackages_1 = require("./seedServicePackages");
dotenv_1.default.config();
const importData = async () => {
    try {
        await (0, db_1.connectDB)();
        // 🛡️ CHẾ ĐỘ BẢO VỆ DỮ LIỆU KHÁCH HÀNG:
        // Cấm tuyệt đối xóa trắng database nếu không có biến môi trường xác nhận rõ ràng
        if (process.env.ALLOW_DATABASE_WIPE === 'YES_DELETE_ALL_DATA') {
            console.warn('⚠️ [CẢNH BÁO NGUY HIỂM] Đang xóa dữ liệu cũ do có cờ ALLOW_DATABASE_WIPE...');
            await User_1.User.deleteMany();
            await FarmProfile_1.FarmProfile.deleteMany();
            await Cooperative_1.Cooperative.deleteMany();
            await CultivationBoard_1.CultivationBoard.deleteMany();
            await CultivationEntry_1.CultivationEntry.deleteMany();
            await FertilizerBoard_1.FertilizerBoard.deleteMany();
            await FertilizerEntry_1.FertilizerEntry.deleteMany();
            await PesticideBoard_1.PesticideBoard.deleteMany();
            await PesticideEntry_1.PesticideEntry.deleteMany();
            await Material_1.Material.deleteMany();
            await Task_1.Task.deleteMany();
            console.log('Đã xóa toàn bộ dữ liệu cũ...');
        }
        else {
            console.log('🛡️ [AN TOÀN BẢO VỆ] ĐÃ BỎ QUA lệnh xóa trắng database (deleteMany).');
            console.log('🛡️ Toàn bộ tài khoản và dữ liệu nhật ký của người dùng/khách hàng được BẢO TOÀN NGUYÊN VẸN 100%!');
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash('123456', salt);
        // 1. Tạo Admin
        const admin = await User_1.User.create({
            name: 'Quản trị viên Hệ thống',
            email: 'admin@agrilog.com',
            passwordHash,
            role: User_1.Role.ADMIN,
        });
        console.log(`Đã tạo tài khoản Admin: ${admin.email} | Mật khẩu: 123456`);
        // 2. Tạo Cán bộ Quản lý HTX (Cooperative Manager)
        const coopUser = await User_1.User.create({
            name: 'Lê Văn Quản (Cán bộ HTX)',
            phone: '0981234567',
            email: 'coop@agrilog.com',
            passwordHash,
            role: User_1.Role.COOPERATIVE,
        });
        console.log(`Đã tạo tài khoản Cán bộ HTX: ${coopUser.email} | Mật khẩu: 123456`);
        const cooperative = await Cooperative_1.Cooperative.create({
            name: 'Hợp tác xã Nông nghiệp Sạch Hòa Bình',
            code: 'HTX-HB01',
            manager: coopUser._id,
            address: 'Xã Hòa Bình, Huyện Thường Tín, TP. Hà Nội',
            contactPhone: '0981234567',
            email: 'htx.hoabinh@agrilog.vn',
            establishedYear: 2021,
            certificationStandards: ['VietGAP', 'GlobalGAP', 'OCOP 4 Sao'],
            description: 'Hợp tác xã liên kết sản xuất nông sản sạch đạt tiêu chuẩn an toàn sinh học và bao tiêu xuất khẩu.',
            members: [],
        });
        // 3. Tạo Farm chính
        const farm = await User_1.User.create({
            name: 'Nguyễn Văn Tâm',
            phone: '0987654321',
            email: 'farm@agrilog.com',
            passwordHash,
            role: User_1.Role.FARM,
        });
        console.log(`Đã tạo tài khoản Farm: ${farm.email} | Mật khẩu: 123456`);
        const farmProfile = await FarmProfile_1.FarmProfile.create({
            user: farm._id,
            farmName: 'Nông trại Xanh Hưng Yên',
            ownerName: 'Nguyễn Văn Tâm',
            address: 'Văn Giang, Hưng Yên',
            areaSqm: 5000,
            mainCropType: 'Nhãn lồng',
            contactPhone: '0987654321',
            cooperative: cooperative._id,
            plan: 'PREMIUM',
        });
        // 4. Tạo các Hộ xã viên thuộc HTX (để kiểm tra tính năng Dashboard HTX và Cảnh báo an toàn PHI)
        // Hộ anh Ba (Trần Văn Ba) - Phun thuốc hôm qua chưa đủ thời gian cách ly PHI
        const userBa = await User_1.User.create({
            name: 'Trần Văn Ba',
            phone: '0912345678',
            email: 'anhba@agrilog.com',
            passwordHash,
            role: User_1.Role.FARM,
        });
        const profileBa = await FarmProfile_1.FarmProfile.create({
            user: userBa._id,
            farmName: 'Nông trại Ba Hưng',
            ownerName: 'Trần Văn Ba',
            address: 'Xóm 2, Hòa Bình, Thường Tín, Hà Nội',
            areaSqm: 4000,
            mainCropType: 'Dưa lưới',
            contactPhone: '0912345678',
            cooperative: cooperative._id,
            plan: 'STANDARD',
        });
        // Hộ anh Năm (Nguyễn Văn Năm) - Đang giai đoạn thu hoạch an toàn
        const userNam = await User_1.User.create({
            name: 'Nguyễn Văn Năm',
            phone: '0923456789',
            email: 'anhnam@agrilog.com',
            passwordHash,
            role: User_1.Role.FARM,
        });
        const profileNam = await FarmProfile_1.FarmProfile.create({
            user: userNam._id,
            farmName: 'Nông trại Năm Rực',
            ownerName: 'Nguyễn Văn Năm',
            address: 'Xóm 3, Hòa Bình, Thường Tín, Hà Nội',
            areaSqm: 3200,
            mainCropType: 'Cà chua Beef',
            contactPhone: '0923456789',
            cooperative: cooperative._id,
            plan: 'STANDARD',
        });
        // Hộ anh Bảy (Lê Văn Bảy) - Đã kết thúc vụ (COMPLETED), có báo cáo tổng kết
        const userBay = await User_1.User.create({
            name: 'Lê Văn Bảy',
            phone: '0934567890',
            email: 'anhbay@agrilog.com',
            passwordHash,
            role: User_1.Role.FARM,
        });
        const profileBay = await FarmProfile_1.FarmProfile.create({
            user: userBay._id,
            farmName: 'Nông trại Bảy Lành',
            ownerName: 'Lê Văn Bảy',
            address: 'Xóm 1, Hòa Bình, Thường Tín, Hà Nội',
            areaSqm: 4500,
            mainCropType: 'Dưa leo Baby',
            contactPhone: '0934567890',
            cooperative: cooperative._id,
            plan: 'STANDARD',
        });
        // Cập nhật danh sách thành viên trong HTX
        cooperative.members = [farmProfile._id, profileBa._id, profileNam._id, profileBay._id];
        await cooperative.save();
        console.log(`Đã tạo HTX Hòa Bình với 4 hộ xã viên thành viên`);
        // 5. Tạo dữ liệu Mùa vụ & Bảng nhật ký cho Hộ anh Ba (Cảnh báo cách ly PHI)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const gidBa = 'gid_ba_' + Date.now();
        const cBoardBa = await CultivationBoard_1.CultivationBoard.create({
            farmProfile: profileBa._id,
            name: 'Khu B - Dưa lưới Hoàng Kim',
            cropType: 'Dưa lưới',
            areaSqm: 4000,
            startDate: new Date('2026-08-01'),
            status: 'IN_PROGRESS',
            expectedYield: 5000,
            seedCost: 2800000,
            groupId: gidBa,
            hasInitializedEntries: true,
        });
        const pBoardBa = await PesticideBoard_1.PesticideBoard.create({
            farmProfile: profileBa._id,
            name: 'Khu B - Phun thuốc Dưa lưới',
            cropType: 'Dưa lưới',
            areaSqm: 4000,
            startDate: new Date('2026-08-01'),
            status: 'IN_PROGRESS',
            groupId: gidBa,
            hasInitializedEntries: true,
        });
        // Phun thuốc trừ sâu Radiant hôm qua, cách ly 7 ngày
        await PesticideEntry_1.PesticideEntry.create({
            pesticideBoard: pBoardBa._id,
            date: yesterday,
            materialName: 'Thuốc trừ sâu Radiant 60SC',
            manufacturer: 'Dow AgroSciences',
            activeIngredient: 'Spinetoram',
            targetPest: 'Bọ trĩ, sâu vẽ bùa',
            quantity: '250',
            unit: 'ml',
            phiDays: 7, // CẦN CÁCH LY 7 NGÀY
            performer: 'Trần Văn Ba',
            weather: '28°C, Nắng nhẹ',
            cost: 320000,
            notes: 'Phun phòng trừ bọ trĩ lứa 2',
        });
        console.log(`Đã tạo dữ liệu thử nghiệm Cảnh báo PHI cho Hộ anh Ba (vừa phun thuốc hôm qua, cách ly 7 ngày)`);
        // 6. Tạo dữ liệu Mùa vụ cho Hộ anh Năm (Đang THU HOẠCH - an toàn PHI)
        const gidNam = 'gid_nam_' + Date.now();
        const cBoardNam = await CultivationBoard_1.CultivationBoard.create({
            farmProfile: profileNam._id,
            name: 'Khu C - Cà chua Beef VietGAP',
            cropType: 'Cà chua',
            areaSqm: 3200,
            startDate: new Date('2026-07-15'),
            status: 'HARVESTING',
            expectedYield: 6500,
            harvestYield: 6200,
            seedCost: 3500000,
            groupId: gidNam,
            hasInitializedEntries: true,
        });
        const pBoardNam = await PesticideBoard_1.PesticideBoard.create({
            farmProfile: profileNam._id,
            name: 'Khu C - Phun thuốc Cà chua',
            cropType: 'Cà chua',
            areaSqm: 3200,
            startDate: new Date('2026-07-15'),
            status: 'HARVESTING',
            groupId: gidNam,
            hasInitializedEntries: true,
        });
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        await PesticideEntry_1.PesticideEntry.create({
            pesticideBoard: pBoardNam._id,
            date: twoWeeksAgo,
            materialName: 'Chế phẩm sinh học Neem Oil',
            activeIngredient: 'Azadirachtin',
            quantity: '200',
            unit: 'ml',
            phiDays: 3, // Cách ly 3 ngày, đã qua 14 ngày -> AN TOÀN
            performer: 'Nguyễn Văn Năm',
            weather: '27°C, Mây rải rác',
            cost: 180000,
            notes: 'Phun diệt nhện đỏ đợt cuối trước thu hoạch',
        });
        // 7. Tạo dữ liệu Mùa vụ cho Hộ anh Bảy (KẾT THÚC VỤ - COMPLETED kèm Báo cáo tổng kết tự động)
        const gidBay = 'gid_bay_' + Date.now();
        const cBoardBay = await CultivationBoard_1.CultivationBoard.create({
            farmProfile: profileBay._id,
            name: 'Khu D - Dưa leo Nhật Vụ 1',
            cropType: 'Dưa leo',
            areaSqm: 4500,
            startDate: new Date('2026-05-01'),
            status: 'COMPLETED',
            expectedYield: 7000,
            harvestYield: 7450,
            harvestDate: new Date('2026-07-28'),
            completedAt: new Date('2026-07-29'),
            seedCost: 3200000,
            groupId: gidBay,
            hasInitializedEntries: true,
            summaryReport: {
                generatedAt: new Date('2026-07-29'),
                totalSeedCost: 3200000,
                totalFertilizerCost: 4800000,
                totalFertilizerQty: 450,
                fertilizerSummary: [
                    { name: 'Phân NPK Đầu Trâu 20-20-15', quantity: '250 kg', cost: 2800000 },
                    { name: 'Phân Hữu cơ trùn quế', quantity: '200 kg', cost: 2000000 }
                ],
                totalPesticideCost: 1250000,
                totalPesticideApplications: 3,
                pesticideSummary: [
                    { name: 'Chế phẩm Trichoderma', quantity: '2 lần phun', phiDays: 0, cost: 450000 },
                    { name: 'Thuốc sinh học BT', quantity: '1 lần phun', phiDays: 3, cost: 800000 }
                ],
                totalLaborCost: 6500000,
                totalLaborDays: 22,
                actualYield: 7450,
                expectedYield: 7000,
                yieldAchievementRate: 106,
                totalCost: 15750000,
                costPerKg: 2114,
                phiComplianceStatus: 'SAFE',
                phiNotes: 'Vụ mùa đạt 106% kế hoạch sản lượng, tuân thủ 100% quy trình cách ly an toàn VietGAP.',
            }
        });
        // 8. Tạo dữ liệu bảng Farm chính
        const fertilizer1 = await Material_1.Material.create({ farmProfile: farmProfile._id, name: 'Phân NPK 16-16-8', type: 'FERTILIZER', unit: 'kg', quantity: 500, minQuantityAlert: 50 });
        const fertilizer2 = await Material_1.Material.create({ farmProfile: farmProfile._id, name: 'Phân Hữu cơ vi sinh', type: 'FERTILIZER', unit: 'kg', quantity: 1000, minQuantityAlert: 100 });
        const pesticide1 = await Material_1.Material.create({ farmProfile: farmProfile._id, name: 'Thuốc trừ sâu Radiant', type: 'PESTICIDE', unit: 'ml', quantity: 2000, minQuantityAlert: 200 });
        const cBoard = await CultivationBoard_1.CultivationBoard.create({
            farmProfile: farmProfile._id,
            name: 'Khu A - Cà chua Thu Đông',
            cropType: 'Cà chua',
            areaSqm: 1000,
            startDate: new Date('2026-06-01'),
            status: 'IN_PROGRESS',
            expectedYield: 2500,
            seedCost: 1200000,
        });
        const fBoard = await FertilizerBoard_1.FertilizerBoard.create({ farmProfile: farmProfile._id, name: 'Khu A - Bón phân Cà chua', cropType: 'Cà chua', areaSqm: 1000, startDate: new Date('2026-06-01'), status: 'IN_PROGRESS' });
        const pBoard = await PesticideBoard_1.PesticideBoard.create({ farmProfile: farmProfile._id, name: 'Khu A - Phun thuốc Cà chua', cropType: 'Cà chua', areaSqm: 1000, startDate: new Date('2026-06-01'), status: 'IN_PROGRESS' });
        await CultivationEntry_1.CultivationEntry.create({ cultivationBoard: cBoard._id, date: new Date('2026-06-02'), activityName: 'Làm đất, lên luống', cost: 500000, notes: 'Đất tơi xốp, bón lót phân chuồng' });
        await CultivationEntry_1.CultivationEntry.create({ cultivationBoard: cBoard._id, date: new Date('2026-06-05'), activityName: 'Xuống giống', cost: 1200000, notes: 'Giống cà chua lai F1' });
        await FertilizerEntry_1.FertilizerEntry.create({ fertilizerBoard: fBoard._id, date: new Date('2026-06-15'), material: fertilizer1._id, materialName: fertilizer1.name, quantity: '20', unit: 'kg', cost: 360000, notes: 'Bón thúc lần 1' });
        await FertilizerEntry_1.FertilizerEntry.create({ fertilizerBoard: fBoard._id, date: new Date('2026-07-01'), material: fertilizer2._id, materialName: fertilizer2.name, quantity: '50', unit: 'kg', cost: 450000, notes: 'Bón thúc lần 2' });
        await PesticideEntry_1.PesticideEntry.create({ pesticideBoard: pBoard._id, date: new Date('2026-06-20'), material: pesticide1._id, materialName: pesticide1.name, quantity: '150', unit: 'ml', phiDays: 7, cost: 210000, notes: 'Phòng trừ sâu vẽ bùa' });
        // 9. Tạo Gói dịch vụ
        if (process.env.ALLOW_DATABASE_WIPE === 'YES_DELETE_ALL_DATA') {
            await ServicePackage_1.ServicePackage.deleteMany();
        }
        for (const pkg of seedServicePackages_1.SERVICE_PACKAGES_DATA) {
            await ServicePackage_1.ServicePackage.create(pkg);
        }
        console.log(`Đã tạo dữ liệu Gói dịch vụ`);
        console.log('✅ Toàn bộ dữ liệu mẫu HTX, Thành viên, Mùa vụ và Cảnh báo PHI đã được nạp thành công!');
        process.exit();
    }
    catch (error) {
        console.error(`Lỗi tạo dữ liệu mẫu: ${error.message}`);
        process.exit(1);
    }
};
importData();
