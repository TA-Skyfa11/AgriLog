import mongoose, { Document, Schema } from './supabaseModel';

export interface ICropStandard extends Document {
  cropGroup: string; // 'SHORT_TERM' | 'LONG_TERM' | 'ALL'
  type: string; // 'STAGE' | 'ACTIVITY' | 'PEST' | 'FERTILIZER_DOSAGE' | 'PESTICIDE_DOSAGE' | 'PHI' | 'WEATHER' | 'PERFORMER' | 'FERTILIZER_PURPOSE'
  name: string;
  stageName?: string; // Tên giai đoạn tương ứng (đối với activity để auto-link)
  order: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const cropStandardSchema = new Schema<ICropStandard>(
  {
    cropGroup: { type: String, default: 'SHORT_TERM' },
    type: { type: String, required: true },
    name: { type: String, required: true },
    stageName: { type: String },
    order: { type: Number, default: 0 },
    description: { type: String },
  },
  { timestamps: true }
);

export const CropStandard = mongoose.model<ICropStandard>('CropStandard', cropStandardSchema, 'crop_standards');
