"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("./models/User");
const CompanyProfile_1 = require("./models/CompanyProfile");
const FarmProfile_1 = require("./models/FarmProfile");
const Product_1 = require("./models/Product");
const Order_1 = require("./models/Order");
const CommissionSetting_1 = require("./models/CommissionSetting");
dotenv_1.default.config();
const seedMarketplace = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agrilog');
        console.log('MongoDB Connected for Seeding Marketplace...');
        // Clear existing marketplace data
        await CompanyProfile_1.CompanyProfile.deleteMany();
        await Product_1.Product.deleteMany();
        await Order_1.Order.deleteMany();
        await CommissionSetting_1.CommissionSetting.deleteMany();
        // 1. Commission Setting
        await CommissionSetting_1.CommissionSetting.create({
            rate: 5,
            description: 'Mức hoa hồng mặc định 5%',
        });
        console.log('Created Commission Setting: 5%');
        // 2. Create Company
        const salt = await bcryptjs_1.default.genSalt(10);
        const companyPassword = await bcryptjs_1.default.hash('123456', salt);
        let companyUser = await User_1.User.findOne({ email: 'company@agrilog.com' });
        if (!companyUser) {
            companyUser = await User_1.User.create({
                email: 'company@agrilog.com',
                passwordHash: companyPassword,
                role: User_1.Role.COMPANY,
                allowAdminReset: true,
            });
        }
        await CompanyProfile_1.CompanyProfile.create({
            user: companyUser._id,
            companyName: 'Công ty Phân bón Bình Điền',
            address: '123 Đường Điện Biên Phủ, TP.HCM',
            contactPhone: '0901234567',
            businessType: 'Sản xuất phân bón & vật tư nông nghiệp',
            taxCode: '0312345678',
        });
        console.log('Created Company: company@agrilog.com');
        // 3. Create Farm
        const farmPassword = await bcryptjs_1.default.hash('123456', salt);
        let farmUser = await User_1.User.findOne({ email: 'farm@gmail.com' });
        if (!farmUser) {
            farmUser = await User_1.User.create({
                email: 'farm@gmail.com',
                passwordHash: farmPassword,
                role: User_1.Role.FARM,
            });
            await FarmProfile_1.FarmProfile.create({
                user: farmUser._id,
                farmName: 'Nông trại Xanh Tâm Bình',
                address: 'Huyện Củ Chi, TP.HCM',
                contactPhone: '0987654321',
                mainCropType: 'Rau sạch thủy canh',
                areaSqm: 5000,
            });
        }
        console.log('Created/Found Farm: farm@gmail.com');
        // 4. Create Products
        const productsToInsert = [
            {
                company: companyUser._id,
                name: 'Phân bón NPK 16-16-8',
                description: 'Phân bón NPK chuyên dùng cho lúa, rau màu và cây ăn trái. Giúp cây phát triển cân đối, tăng năng suất.',
                category: Product_1.ProductCategory.FERTILIZER,
                price: 250000,
                unit: 'Bao 25kg',
                stock: 100,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['https://images.unsplash.com/photo-1628186178713-75b5b244766f?q=80&w=600&auto=format&fit=crop'],
            },
            {
                company: companyUser._id,
                name: 'Thuốc trừ sâu sinh học Neem',
                description: 'Chiết xuất từ dầu Neem tự nhiên, an toàn cho người và vật nuôi, diệt trừ sâu bệnh hiệu quả cho vườn rau sạch.',
                category: Product_1.ProductCategory.PESTICIDE,
                price: 85000,
                unit: 'Chai 500ml',
                stock: 50,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=600&auto=format&fit=crop'],
            },
            {
                company: companyUser._id,
                name: 'Hạt giống Cà chua Cherry',
                description: 'Hạt giống cà chua F1 nhập khẩu, tỷ lệ nảy mầm > 95%, chịu nhiệt tốt, cho trái ngọt.',
                category: Product_1.ProductCategory.SEED,
                price: 35000,
                unit: 'Gói 10g',
                stock: 200,
                status: Product_1.ProductStatus.PENDING,
                filterPassed: true,
                images: ['https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=600&auto=format&fit=crop'],
            },
            {
                company: companyUser._id,
                name: 'Máy bơm chìm tưới tiêu tự động',
                description: 'Hệ thống bơm thông minh kết hợp rơ le tự động. Thích hợp cho hệ thống tưới nhỏ giọt hoặc tưới phun sương.',
                category: Product_1.ProductCategory.TOOL,
                price: 1200000,
                unit: 'Máy',
                stock: 10,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=600&auto=format&fit=crop'],
            },
            {
                company: companyUser._id,
                name: 'Dây thun dệt may (Mẫu thử)',
                description: 'Dây thun công nghiệp, không liên quan nông nghiệp.',
                category: Product_1.ProductCategory.OTHER,
                price: 15000,
                unit: 'Cuộn',
                stock: 100,
                status: Product_1.ProductStatus.REJECTED,
                filterPassed: false,
                rejectionReason: 'Sản phẩm không liên quan đến nông nghiệp. Vui lòng kiểm tra lại tên, mô tả hoặc chọn danh mục phù hợp.',
                images: [],
            }
        ];
        const insertedProducts = await Product_1.Product.insertMany(productsToInsert);
        console.log(`Created ${insertedProducts.length} Products`);
        // 5. Create Order
        const approvedProduct = insertedProducts[0]; // Phân bón NPK
        await Order_1.Order.create({
            farm: farmUser._id,
            company: companyUser._id,
            items: [
                {
                    product: approvedProduct._id,
                    productName: approvedProduct.name,
                    quantity: 2,
                    priceAtPurchase: approvedProduct.price,
                }
            ],
            totalAmount: approvedProduct.price * 2, // 500,000
            commissionRate: 5,
            commissionAmount: (approvedProduct.price * 2) * 0.05, // 25,000
            status: Order_1.OrderStatus.PENDING,
            note: 'Giao giờ hành chính',
        });
        // Decrease stock
        approvedProduct.stock -= 2;
        await approvedProduct.save();
        console.log('Created Sample Order (Total: 500k, Commission: 25k)');
        console.log('✅ Marketplace Seeding Completed Successfully!');
        process.exit();
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
seedMarketplace();
