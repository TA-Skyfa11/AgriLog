import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFertilizerBoard extends Document {
  farmProfile: Types.ObjectId;
  name: string;
  cropType: string;
  areaSqm: number;
  areaText?: string;
  startDate: Date;
  status: 'ACTIVE' | 'CLOSED';
  description?: string;
  customColumns?: string[];
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const fertilizerBoardSchema = new Schema<IFertilizerBoard>(
  {
    farmProfile: { type: Schema.Types.ObjectId, ref: 'FarmProfile', required: true },
    name: { type: String, required: true },
    cropType: { type: String, required: true },
    areaSqm: { type: Number, required: true },
    areaText: { type: String },
    startDate: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' },
    description: { type: String },
    customColumns: [{ type: String }],
    groupId: { type: String },
  },
  { timestamps: true }
);

export const FertilizerBoard = mongoose.model<IFertilizerBoard>('FertilizerBoard', fertilizerBoardSchema);
