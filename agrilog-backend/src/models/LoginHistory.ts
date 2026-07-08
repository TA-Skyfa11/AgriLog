import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILoginHistory extends Document {
  user: Types.ObjectId;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

const loginHistorySchema = new Schema<ILoginHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export const LoginHistory = mongoose.model<ILoginHistory>('LoginHistory', loginHistorySchema);
