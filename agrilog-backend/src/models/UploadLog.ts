import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUploadLog extends Document {
  farmProfile: Types.ObjectId;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const uploadLogSchema = new Schema<IUploadLog>(
  {
    farmProfile: { type: Schema.Types.ObjectId, ref: 'FarmProfile', required: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export const UploadLog = mongoose.model<IUploadLog>('UploadLog', uploadLogSchema);
