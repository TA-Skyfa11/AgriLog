import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPesticideEntry extends Document {
  pesticideBoard: Types.ObjectId;
  date: Date;
  material?: Types.ObjectId;
  materialName?: string;
  activeIngredient?: string; // Hoạt chất
  targetPest?: string; // Mục tiêu phòng trừ
  quantity?: string; // Liều lượng
  unit?: string; // Đơn vị
  phiDays?: number; // Thời gian cách ly (ngày)
  performer?: string; // Người thực hiện
  cost?: number; // Chi phí
  notes?: string; // Ghi chú
  imageUrls?: string[]; // Hình ảnh
  createdAt: Date;
  updatedAt: Date;
}

const pesticideEntrySchema = new Schema<IPesticideEntry>(
  {
    pesticideBoard: { type: Schema.Types.ObjectId, ref: 'PesticideBoard', required: true },
    date: { type: Date, required: true },
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    materialName: { type: String },
    activeIngredient: { type: String },
    targetPest: { type: String },
    quantity: { type: String },
    unit: { type: String },
    phiDays: { type: Number },
    performer: { type: String },
    cost: { type: Number, default: 0 },
    notes: { type: String },
    imageUrls: [{ type: String }],
  },
  { timestamps: true }
);

export const PesticideEntry = mongoose.model<IPesticideEntry>('PesticideEntry', pesticideEntrySchema);
