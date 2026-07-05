import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPesticideEntry extends Document {
  pesticideBoard: Types.ObjectId;
  date: Date;
  material?: Types.ObjectId;
  materialName?: string;
  quantity?: number;
  unit?: string;
  phiDays?: number;
  notes?: string;
  imageUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const pesticideEntrySchema = new Schema<IPesticideEntry>(
  {
    pesticideBoard: { type: Schema.Types.ObjectId, ref: 'PesticideBoard', required: true },
    date: { type: Date, required: true },
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    materialName: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    phiDays: { type: Number },
    notes: { type: String },
    imageUrls: [{ type: String }],
  },
  { timestamps: true }
);

export const PesticideEntry = mongoose.model<IPesticideEntry>('PesticideEntry', pesticideEntrySchema);
