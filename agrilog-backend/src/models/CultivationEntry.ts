import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICultivationEntry extends Document {
  cultivationBoard: Types.ObjectId;
  date: Date;
  activityName: string;
  notes?: string;
  imageUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const cultivationEntrySchema = new Schema<ICultivationEntry>(
  {
    cultivationBoard: { type: Schema.Types.ObjectId, ref: 'CultivationBoard', required: true },
    date: { type: Date, required: true },
    activityName: { type: String, required: true },
    notes: { type: String },
    imageUrls: [{ type: String }],
  },
  { timestamps: true }
);

export const CultivationEntry = mongoose.model<ICultivationEntry>('CultivationEntry', cultivationEntrySchema);
