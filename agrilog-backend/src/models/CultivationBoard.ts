import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICultivationBoard extends Document {
  farmProfile: Types.ObjectId;
  name: string;
  cropType: string;
  areaSqm: number;
  startDate: Date;
  status: 'ACTIVE' | 'HARVESTED' | 'CANCELLED';
  description?: string;
  expectedHarvestDate?: Date;
  harvestYield?: number;
  harvestDate?: Date;
  customColumns: string[];
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const cultivationBoardSchema = new Schema<ICultivationBoard>(
  {
    farmProfile: { type: Schema.Types.ObjectId, ref: 'FarmProfile', required: true },
    name: { type: String, required: true },
    cropType: { type: String, required: true },
    areaSqm: { type: Number, required: true },
    startDate: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'HARVESTED', 'CANCELLED'], default: 'ACTIVE' },
    description: { type: String },
    expectedHarvestDate: { type: Date },
    harvestYield: { type: Number },
    harvestDate: { type: Date },
    customColumns: [{ type: String }],
    groupId: { type: String },
  },
  { timestamps: true }
);

export const CultivationBoard = mongoose.model<ICultivationBoard>('CultivationBoard', cultivationBoardSchema);
