import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPesticideBoard extends Document {
  farmProfile: Types.ObjectId;
  name: string;
  cropType: string;
  areaSqm: number;
  startDate: Date;
  status: 'ACTIVE' | 'CLOSED';
  description?: string;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pesticideBoardSchema = new Schema<IPesticideBoard>(
  {
    farmProfile: { type: Schema.Types.ObjectId, ref: 'FarmProfile', required: true },
    name: { type: String, required: true },
    cropType: { type: String, required: true },
    areaSqm: { type: Number, required: true },
    startDate: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' },
    description: { type: String },
    groupId: { type: String },
  },
  { timestamps: true }
);

export const PesticideBoard = mongoose.model<IPesticideBoard>('PesticideBoard', pesticideBoardSchema);
