import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId;
  title: string;
  message: string;
  type: 'TASK' | 'BILLING' | 'SYSTEM';
  isRead: boolean;
  referenceId?: string; // ID of the task or related entity
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['TASK', 'BILLING', 'SYSTEM'], default: 'SYSTEM' },
    isRead: { type: Boolean, default: false },
    referenceId: { type: String },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
