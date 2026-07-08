import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICommissionSetting extends Document {
  rate: number;
  description: string;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const commissionSettingSchema = new Schema<ICommissionSetting>(
  {
    rate: { type: Number, required: true, default: 5, min: 0, max: 100 },
    description: { type: String, default: 'Mức hoa hồng mặc định' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const CommissionSetting = mongoose.model<ICommissionSetting>('CommissionSetting', commissionSettingSchema);
