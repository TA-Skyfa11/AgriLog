import mongoose, { Document, Schema, Types } from 'mongoose';

export enum DiaryType {
  ACTIVITY = 'ACTIVITY',     // Nhật ký canh tác chung
  FERTILIZER = 'FERTILIZER', // Nhật ký phân bón
  PESTICIDE = 'PESTICIDE',   // Nhật ký thuốc BVTV
}

export interface IDiaryEntry extends Document {
  cropBoard: Types.ObjectId;
  type: DiaryType;
  date: Date;
  activityName?: string; // For ACTIVITY
  material?: Types.ObjectId; // Reference to Material for FERTILIZER / PESTICIDE
  materialName?: string; // Cache the name just in case
  quantity?: number;     // For FERTILIZER / PESTICIDE
  unit?: string;         // kg, lit, ml...
  phiDays?: number;      // Thời gian cách ly (PHI) for PESTICIDE
  notes?: string;
  imageUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const diaryEntrySchema = new Schema<IDiaryEntry>(
  {
    cropBoard: { type: Schema.Types.ObjectId, ref: 'CropBoard', required: true },
    type: { type: String, enum: Object.values(DiaryType), required: true },
    date: { type: Date, required: true },
    activityName: { type: String },
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    materialName: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    phiDays: { type: Number },
    notes: { type: String },
    imageUrls: [{ type: String }],
  },
  { timestamps: true }
);

export const DiaryEntry = mongoose.model<IDiaryEntry>('DiaryEntry', diaryEntrySchema);
