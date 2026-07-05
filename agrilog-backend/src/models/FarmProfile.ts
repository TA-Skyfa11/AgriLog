import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFarmProfile extends Document {
  user: Types.ObjectId;
  farmName: string;
  address: string;
  areaSqm: number;
  mainCropType: string;
  contactPhone: string;
  plan: 'BASIC' | 'STANDARD' | 'PREMIUM';
  createdAt: Date;
  updatedAt: Date;
}

const farmProfileSchema = new Schema<IFarmProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    farmName: { type: String, required: true },
    address: { type: String, required: false },
    areaSqm: { type: Number, required: false },
    mainCropType: { type: String, required: false },
    contactPhone: { type: String, required: false },
    plan: { type: String, enum: ['BASIC', 'STANDARD', 'PREMIUM'], default: 'BASIC' },
  },
  { timestamps: true }
);

export const FarmProfile = mongoose.model<IFarmProfile>('FarmProfile', farmProfileSchema);
