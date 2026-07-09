"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = exports.ProductStatus = exports.ProductCategory = void 0;
exports.checkAgricultureRelevance = checkAgricultureRelevance;
const mongoose_1 = __importStar(require("mongoose"));
var ProductCategory;
(function (ProductCategory) {
    ProductCategory["FERTILIZER"] = "FERTILIZER";
    ProductCategory["PESTICIDE"] = "PESTICIDE";
    ProductCategory["SEED"] = "SEED";
    ProductCategory["TOOL"] = "TOOL";
    ProductCategory["OTHER"] = "OTHER";
})(ProductCategory || (exports.ProductCategory = ProductCategory = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["PENDING"] = "PENDING";
    ProductStatus["APPROVED"] = "APPROVED";
    ProductStatus["REJECTED"] = "REJECTED";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
const productSchema = new mongoose_1.Schema({
    company: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: Object.values(ProductCategory), required: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    images: [{ type: String }],
    status: { type: String, enum: Object.values(ProductStatus), default: ProductStatus.PENDING },
    rejectionReason: { type: String, default: '' },
    filterPassed: { type: Boolean, default: false },
}, { timestamps: true });
// Agriculture keyword filter
const AGRICULTURE_KEYWORDS = [
    'phân bón', 'thuốc trừ sâu', 'thuốc bảo vệ', 'giống cây', 'hạt giống',
    'nông cụ', 'máy cày', 'máy gặt', 'tưới tiêu', 'vòi phun', 'bình xịt',
    'phân hữu cơ', 'phân vi sinh', 'nhà kính', 'lưới che', 'bạt phủ',
    'cuốc', 'xẻng', 'liềm', 'dao', 'kéo cắt cành', 'thức ăn chăn nuôi',
    'cám', 'vaccine', 'thuốc thú y', 'giống gia súc', 'giống gia cầm',
    'nông nghiệp', 'canh tác', 'trồng trọt', 'chăn nuôi', 'thủy sản',
    'nuôi trồng', 'phân NPK', 'ure', 'kali', 'DAP', 'lân', 'đạm',
    'thuốc diệt cỏ', 'thuốc diệt nấm', 'thuốc kích thích', 'hormone thực vật',
    'máy bơm nước', 'máy phun thuốc', 'ống dẫn nước', 'hệ thống tưới',
    'lúa', 'ngô', 'khoai', 'sắn', 'rau', 'củ', 'quả', 'trái cây',
    'cà phê', 'chè', 'cao su', 'tiêu', 'điều', 'sầu riêng', 'nhãn',
    'vải', 'xoài', 'bưởi', 'cam', 'chanh', 'nông sản', 'vật tư nông nghiệp',
    'dụng cụ làm vườn', 'đất trồng', 'giá thể', 'chậu trồng', 'khay ươm',
];
function checkAgricultureRelevance(name, description, category) {
    // Auto-pass for explicitly agricultural categories
    if ([ProductCategory.FERTILIZER, ProductCategory.PESTICIDE, ProductCategory.SEED, ProductCategory.TOOL].includes(category)) {
        return { passed: true, reason: '' };
    }
    // For OTHER category, check keywords
    const text = `${name} ${description}`.toLowerCase();
    const found = AGRICULTURE_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
    if (found) {
        return { passed: true, reason: '' };
    }
    return { passed: false, reason: 'Sản phẩm không liên quan đến nông nghiệp. Vui lòng kiểm tra lại tên, mô tả hoặc chọn danh mục phù hợp.' };
}
exports.Product = mongoose_1.default.model('Product', productSchema);
