import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICropBoard extends Document {
  farmProfile: Types.ObjectId;
  name: string;
  cropType: string;
  areaSqm: number;
  startDate: Date;
  status: 'ACTIVE' | 'HARVESTED' | 'CANCELLED';
  expectedHarvestDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cropBoardSchema = new Schema<ICropBoard>(
  {
    farmProfile: { type: Schema.Types.ObjectId, ref: 'FarmProfile', required: true },
    name: { type: String, required: true },
    cropType: { type: String, required: true },
    areaSqm: { type: Number, required: true },
    startDate: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'HARVESTED', 'CANCELLED'], default: 'ACTIVE' },
    expectedHarvestDate: { type: Date },
  },
  { timestamps: true }
);

export const CropBoard = mongoose.model<ICropBoard>('CropBoard', cropBoardSchema);
