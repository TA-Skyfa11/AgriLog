import mongoose, { Document, Schema, Types } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface IPaymentTransaction extends Document {
  user: Types.ObjectId;
  farmProfile?: Types.ObjectId;
  packageCode: string;
  packageName: string;
  amount: number;
  paymentCode: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrUrl: string;
  status: PaymentStatus;
  sepayTransactionId?: string;
  sepayReferenceCode?: string;
  transferDate?: Date;
  rawWebhookData?: any;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farmProfile: { type: Schema.Types.ObjectId, ref: 'FarmProfile' },
    packageCode: { type: String, required: true, uppercase: true },
    packageName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentCode: { type: String, required: true, unique: true, uppercase: true, index: true },
    bankName: { type: String, default: 'MBBank' },
    accountNumber: { type: String, default: '88020305666999' },
    accountHolder: { type: String, default: 'NGUYEN TUNG ANH' },
    qrUrl: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    sepayTransactionId: { type: String, sparse: true },
    sepayReferenceCode: { type: String },
    transferDate: { type: Date },
    rawWebhookData: { type: Schema.Types.Mixed },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const PaymentTransaction = mongoose.model<IPaymentTransaction>(
  'PaymentTransaction',
  paymentTransactionSchema
);
