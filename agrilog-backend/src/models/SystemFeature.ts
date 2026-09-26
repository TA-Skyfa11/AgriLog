import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISystemFeature extends Document {
  key: string;
  name: string;
  description: string;
  category: 'FARM' | 'COMPANY' | 'COMMON';
  path: string;
  isEnabled: boolean;
  icon?: string;
  order: number;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const systemFeatureSchema = new Schema<ISystemFeature>(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { 
      type: String, 
      enum: ['FARM', 'COMPANY', 'COMMON'], 
      default: 'FARM' 
    },
    path: { type: String, required: true, trim: true },
    isEnabled: { type: Boolean, default: true },
    icon: { type: String, default: '' },
    order: { type: Number, default: 0 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Index for fast query of enabled features
systemFeatureSchema.index({ isEnabled: 1, category: 1 });

export const SystemFeature = mongoose.model<ISystemFeature>('SystemFeature', systemFeatureSchema);
