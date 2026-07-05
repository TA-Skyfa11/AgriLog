import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMaterial extends Document {
  farmProfile: Types.ObjectId;
  name: string;
  type: 'FERTILIZER' | 'PESTICIDE';
  quantity: number;
  unit: string;
  minQuantityAlert: number;
  createdAt: Date;
  updatedAt: Date;
}

const materialSchema = new Schema<IMaterial>(
  {
    farmProfile: { type: Schema.Types.ObjectId, ref: 'FarmProfile', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['FERTILIZER', 'PESTICIDE'], required: true },
    quantity: { type: Number, default: 0 },
    unit: { type: String, required: true },
    minQuantityAlert: { type: Number, default: 10 },
  },
  { timestamps: true }
);

export const Material = mongoose.model<IMaterial>('Material', materialSchema);
