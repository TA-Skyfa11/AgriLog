import mongoose, { Document, Schema, Types } from 'mongoose';

export enum ProductCategory {
  FERTILIZER = 'FERTILIZER',
  PESTICIDE = 'PESTICIDE',
  SEED = 'SEED',
  TOOL = 'TOOL',
  OTHER = 'OTHER',
}

export enum ProductStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IProduct extends Document {
  company: Types.ObjectId;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  unit: string;
  stock: number;
  images: string[];
  status: ProductStatus;
  rejectionReason: string;
  filterPassed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    company: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
  },
  { timestamps: true }
);

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

export function checkAgricultureRelevance(name: string, description: string, category: ProductCategory): { passed: boolean; reason: string } {
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

export const Product = mongoose.model<IProduct>('Product', productSchema);
