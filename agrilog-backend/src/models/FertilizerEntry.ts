import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFertilizerEntry extends Document {
  fertilizerBoard: Types.ObjectId;
  date: Date;
  material?: Types.ObjectId;
  materialName?: string;
  manufacturer?: string; // Nhà sản xuất
  quantity?: string; // Liều lượng / Số lượng sử dụng
  unit?: string; // Đơn vị
  appliedArea?: number; // Diện tích áp dụng (m2)
  performer?: string; // Người thực hiện
  isNotUsed?: boolean; // Không sử dụng
  weather?: string; // Thời tiết
  notes?: string; // Ghi chú
  imageUrls?: string[]; // Hình ảnh
  createdAt: Date;
  updatedAt: Date;
}

const fertilizerEntrySchema = new Schema<IFertilizerEntry>(
  {
    fertilizerBoard: { type: Schema.Types.ObjectId, ref: 'FertilizerBoard', required: true },
    date: { type: Date, required: true },
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    materialName: { type: String },
    manufacturer: { type: String },
    quantity: { type: String },
    unit: { type: String },
    appliedArea: { type: Number },
    performer: { type: String },
    isNotUsed: { type: Boolean, default: false },
    weather: { type: String },
    notes: { type: String },
    imageUrls: [{ type: String }],
  },
  { timestamps: true }
);

export const FertilizerEntry = mongoose.model<IFertilizerEntry>('FertilizerEntry', fertilizerEntrySchema);
