import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFertilizerEntry extends Document {
  fertilizerBoard: Types.ObjectId;
  date: Date;
  material?: Types.ObjectId;
  materialName?: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  imageUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const fertilizerEntrySchema = new Schema<IFertilizerEntry>(
  {
    fertilizerBoard: { type: Schema.Types.ObjectId, ref: 'FertilizerBoard', required: true },
    date: { type: Date, required: true },
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    materialName: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    notes: { type: String },
    imageUrls: [{ type: String }],
  },
  { timestamps: true }
);

export const FertilizerEntry = mongoose.model<IFertilizerEntry>('FertilizerEntry', fertilizerEntrySchema);
