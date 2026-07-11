import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFarmProfile extends Document {
  user: Types.ObjectId;
  farmName: string;
  address: string;
  areaSqm: number;
  mainCropType: string;
  contactPhone: string;
  plan: 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM';
  planExpiresAt?: Date;
  previousPlan?: 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM';
  notificationPreferences: {
    push: boolean;
    email: boolean;
    tasks: boolean;
    billing: boolean;
  };
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
    plan: { type: String, enum: ['FREE', 'BASIC', 'STANDARD', 'PREMIUM'], default: 'FREE' },
    planExpiresAt: { type: Date, required: false },
    previousPlan: { type: String, enum: ['FREE', 'BASIC', 'STANDARD', 'PREMIUM'], required: false },
    notificationPreferences: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      tasks: { type: Boolean, default: true },
      billing: { type: Boolean, default: true },
    }
  },
  { timestamps: true }
);

export const FarmProfile = mongoose.model<IFarmProfile>('FarmProfile', farmProfileSchema);
