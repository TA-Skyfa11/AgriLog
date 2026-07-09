import mongoose, { Document, Schema } from 'mongoose';

export interface IServicePackage extends Document {
  name: string;
  code: string;
  price: number;
  description: string;
  features: string[];
  maxImages: number;
  maxBoards: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const servicePackageSchema = new Schema<IServicePackage>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, required: false, default: '' },
    features: [{ type: String }],
    maxImages: { type: Number, default: 50 },
    maxBoards: { type: Number, default: 3 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ServicePackage = mongoose.model<IServicePackage>('ServicePackage', servicePackageSchema);
