import mongoose, { Document, Schema, Types } from './supabaseModel';

export interface IFertilizerBoard extends Document {
  farmProfile: Types.ObjectId;
  name: string;
  cropType: string;
  areaSqm: number;
  areaText?: string;
  startDate: Date;
  status: 'PLANNING' | 'IN_PROGRESS' | 'HARVESTING' | 'COMPLETED' | 'ACTIVE' | 'CLOSED';
  description?: string;
  customColumns?: string[];
  groupId?: string;
  hasInitializedEntries?: boolean;
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
    status: { type: String, enum: ['PLANNING', 'IN_PROGRESS', 'HARVESTING', 'COMPLETED', 'ACTIVE', 'CLOSED'], default: 'IN_PROGRESS' },
    description: { type: String },
    customColumns: [{ type: String }],
    groupId: { type: String },
    hasInitializedEntries: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const FertilizerBoard = mongoose.model<IFertilizerBoard>('FertilizerBoard', fertilizerBoardSchema);
