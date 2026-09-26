import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITrialSetting extends Document {
  isEnabled: boolean;
  durationMonths: number;
  trialPlan: 'BASIC' | 'STANDARD' | 'PREMIUM';
  lockOnExpiry: boolean;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const trialSettingSchema = new Schema<ITrialSetting>(
  {
    isEnabled: { type: Boolean, default: true },
    durationMonths: { type: Number, default: 1, min: 1, max: 24 },
    trialPlan: {
      type: String,
      enum: ['BASIC', 'STANDARD', 'PREMIUM'],
      default: 'PREMIUM',
    },
    lockOnExpiry: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const TrialSetting = mongoose.model<ITrialSetting>('TrialSetting', trialSettingSchema);
