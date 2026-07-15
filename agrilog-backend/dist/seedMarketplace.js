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
        // 1. Commission Setting
        const existingCommission = await CommissionSetting_1.CommissionSetting.findOne({ rate: 5 });
        if (!existingCommission) {
            await CommissionSetting_1.CommissionSetting.create({
                rate: 5,
                description: 'Mức hoa hồng mặc định 5%',
            });
            console.log('Created Commission Setting: 5%');
        }
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
        const existingCompanyProfile = await CompanyProfile_1.CompanyProfile.findOne({ taxCode: '0312345678' });
        if (!existingCompanyProfile) {
            await CompanyProfile_1.CompanyProfile.create({
                user: companyUser._id,
                companyName: 'Công ty Phân bón Bình Điền',
                address: '123 Đường Điện Biên Phủ, TP.HCM',
                contactPhone: '0901234567',
                businessType: 'Sản xuất phân bón & vật tư nông nghiệp',
                taxCode: '0312345678',
            });
            console.log('Created Company Profile: Công ty Phân bón Bình Điền');
        }
        // 3. Create Farm
        const farmPassword = await bcryptjs_1.default.hash('123456', salt);
        let farmUser = await User_1.User.findOne({ email: 'farm@gmail.com' });
        if (!farmUser) {
            farmUser = await User_1.User.create({
                email: 'farm@gmail.com',
                passwordHash: farmPassword,
                role: User_1.Role.FARM,
            });
        }
        const existingFarmProfile = await FarmProfile_1.FarmProfile.findOne({ user: farmUser._id });
        if (!existingFarmProfile) {
            await FarmProfile_1.FarmProfile.create({
                user: farmUser._id,
                farmName: 'Nông trại Xanh Tâm Bình',
                address: 'Huyện Củ Chi, TP.HCM',
                contactPhone: '0987654321',
                mainCropType: 'Rau sạch thủy canh',
                areaSqm: 5000,
            });
            console.log('Created Farm Profile: Nông trại Xanh Tâm Bình');
        }
        // 4. Create Products
        const productsToInsert = [
            // --- PHÂN BÓN ---
            {
                company: companyUser._id,
                name: 'Phân bón NPK Phú Mỹ 15-15-15',
                description: 'Phân bón NPK tổng hợp chuyên dùng cho cây lúa, cây ăn trái. Giúp tăng năng suất, chống chịu hạn hán.',
                category: Product_1.ProductCategory.FERTILIZER,
                price: 750000,
                unit: 'Bao 50kg',
                stock: 100,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['http://pmb.vn/Uploads/images/NPK-Ph%C3%BA-M%E1%BB%B9-15-15-15-mat-truoc%20-%20Copy.png'],
            },
            {
                company: companyUser._id,
                name: 'Phân bón lá sinh học Atonik 1.8 SL',
                description: 'Kích thích sinh trưởng cây trồng, giúp ra rễ, nảy mầm nhanh, phục hồi cây sau khi ngập úng hoặc sâu bệnh.',
                category: Product_1.ProductCategory.FERTILIZER,
                price: 15000,
                unit: 'Gói 10ml',
                stock: 100,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['https://th-agricare.com.vn/wp-content/uploads/2021/06/thuoc-kich-thich-sinh-truong-phan-bon-la-atonik-10ml-binh-thuan-2.jpg'],
            },
            {
                company: companyUser._id,
                name: 'Phân hữu cơ vi sinh Đầu Trâu Trichoderma',
                description: 'Bổ sung chất hữu cơ và vi sinh vật có ích cho đất, giúp cải tạo đất, rễ phát triển mạnh, ngăn ngừa nấm bệnh.',
                category: Product_1.ProductCategory.FERTILIZER,
                price: 45000,
                unit: 'Gói 1kg',
                stock: 100,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['https://product.hstatic.net/1000269461/product/dtrau_fe1a030c835445d58f53a92982d25e04.png'],
            },
            {
                company: companyUser._id,
                name: 'Phân bón DAP Đình Vũ 46-18-0',
                description: 'Cung cấp Lân và Đạm hàm lượng cao, giúp cây bén rễ nhanh, đẻ nhánh khỏe, phù hợp mọi loại đất.',
                category: Product_1.ProductCategory.FERTILIZER,
                price: 900000,
                unit: 'Bao 50kg',
                stock: 100,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['https://images.unsplash.com/photo-1628186178713-75b5b244766f?q=80&w=600'],
            },
            {
                company: companyUser._id,
                name: 'Phân bón Urê Đạm Cà Mau',
                description: 'Phân đạm hạt đục, tan chậm, cung cấp đạm cao giúp cây phát triển thân lá xanh tốt, tăng cường quang hợp.',
                category: Product_1.ProductCategory.FERTILIZER,
                price: 550000,
                unit: 'Bao 50kg',
                stock: 100,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=600'],
            },
            {
                company: companyUser._id,
                name: 'Phân bón Lân nung chảy Văn Điển',
                description: 'Cung cấp Lân, Canxi, Magie giúp hạ phèn, khử chua, chống đổ ngã cho cây lúa và cây công nghiệp.',
                category: Product_1.ProductCategory.FERTILIZER,
                price: 250000,
                unit: 'Bao 50kg',
                stock: 100,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=600'],
            },
            // --- THUỐC BẢO VỆ THỰC VẬT ---
            {
                company: companyUser._id,
                name: 'Thuốc trừ sâu sinh học Radiant 60SC',
                description: 'Thuốc trừ sâu thế hệ mới, đặc trị bọ trĩ, sâu tơ, dòi đục lá. Nguồn gốc sinh học, an toàn cho môi trường.',
                category: Product_1.ProductCategory.PESTICIDE,
                price: 35000,
                unit: 'Chai 15ml',
                stock: 100,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=600'],
            },
            {
                company: companyUser._id,
                name: 'Thuốc trừ bệnh Anvil 5SC',
                description: 'Đặc trị nấm hồng, rỉ sắt, đốm vằn trên lúa và cây công nghiệp. Giúp xanh lá, tăng cường khả năng quang hợp.',
                category: Product_1.ProductCategory.PESTICIDE,
                price: 210000,
                unit: 'Chai 1 Lít',
                stock: 100,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=600'],
            },
            {
                company: companyUser._id,
                name: 'Thuốc diệt cỏ lưu dẫn Roundup 480SC',
                description: 'Thuốc trừ cỏ lưu dẫn không chọn lọc, tiêu diệt mầm cỏ từ rễ đến ngọn. Sử dụng cho vườn cây ăn trái, cà phê.',
                category: Product_1.ProductCategory.PESTICIDE,
                price: 165000,
                unit: 'Chai 1 Lít',
                stock: 100,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=600'],
            },
            {
                company: companyUser._id,
                name: 'Thuốc trừ rầy Chess 50WG',
                description: 'Đặc trị rầy nâu hại lúa, rầy mềm, rệp sáp. Hiệu quả kéo dài, cơ chế chống rầy chích hút lây lan bệnh.',
                category: Product_1.ProductCategory.PESTICIDE,
                price: 45000,
                unit: 'Gói 15g',
                stock: 100,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=600'],
            },
            {
                company: companyUser._id,
                name: 'Thuốc trừ sâu Tasieu 5WG',
                description: 'Hoạt chất Emamectin benzoate diệt sâu xanh, sâu cuốn lá, nhện đỏ cực mạnh và ít độc hại cho thiên địch.',
                category: Product_1.ProductCategory.PESTICIDE,
                price: 12000,
                unit: 'Gói 10g',
                stock: 100,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=600'],
            },
            {
                company: companyUser._id,
                name: 'Thuốc trừ bệnh Tilt Super 300EC',
                description: 'Đặc trị lem lép hạt, vàng lá chín sớm trên lúa, rỉ sắt trên cà phê. Phổ tác động rộng, phòng trừ nhiều nấm bệnh.',
                category: Product_1.ProductCategory.PESTICIDE,
                price: 120000,
                unit: 'Chai 100ml',
                stock: 100,
                status: Product_1.ProductStatus.APPROVED,
                filterPassed: true,
                images: ['https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?q=80&w=600'],
            }
        ];
        let newProductsCount = 0;
        for (const p of productsToInsert) {
            const existingProduct = await Product_1.Product.findOne({ name: p.name, company: companyUser._id });
            if (!existingProduct) {
                await Product_1.Product.create(p);
                newProductsCount++;
            }
        }
        console.log(`Created ${newProductsCount} new Products`);
        // 5. Create Order
        const approvedProduct = await Product_1.Product.findOne({ name: 'Phân bón NPK Phú Mỹ 15-15-15', company: companyUser._id });
        if (approvedProduct) {
            const existingOrder = await Order_1.Order.findOne({
                farm: farmUser._id,
                company: companyUser._id,
                'items.product': approvedProduct._id
            });
            if (!existingOrder) {
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
                    totalAmount: approvedProduct.price * 2,
                    commissionRate: 5,
                    commissionAmount: (approvedProduct.price * 2) * 0.05,
                    status: Order_1.OrderStatus.PENDING,
                    note: 'Giao giờ hành chính',
                });
                // Decrease stock
                approvedProduct.stock -= 2;
                await approvedProduct.save();
                console.log('Created Sample Order');
            }
        }
        console.log('✅ Marketplace Seeding Completed Successfully!');
        process.exit();
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
seedMarketplace();
