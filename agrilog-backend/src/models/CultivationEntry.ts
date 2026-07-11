import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICultivationEntry extends Document {
  cultivationBoard: Types.ObjectId;
  date: Date;
  stage?: string; // Giai đoạn
  activityName: string; // Hoạt động
  performer?: string; // Người thực hiện
  weather?: string; // Thời tiết
  cost?: number; // Chi phí
  notes?: string; // Ghi chú
  imageUrls?: string[]; // Hình ảnh
  customValues?: any; // Dữ liệu cột tùy chỉnh
  isCompleted?: boolean; // Hoàn thành
  createdAt: Date;
  updatedAt: Date;
}

const cultivationEntrySchema = new Schema<ICultivationEntry>(
  {
    cultivationBoard: { type: Schema.Types.ObjectId, ref: 'CultivationBoard', required: true },
    date: { type: Date, required: true },
    stage: { type: String },
    activityName: { type: String, required: true },
    performer: { type: String },
    weather: { type: String },
    cost: { type: Number, default: 0 },
    notes: { type: String },
    imageUrls: [{ type: String }],
    customValues: { type: Schema.Types.Mixed, default: {} },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CultivationEntry = mongoose.model<ICultivationEntry>('CultivationEntry', cultivationEntrySchema);
