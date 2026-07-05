import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMaterialLog extends Document {
  material: Types.ObjectId;
  type: 'IMPORT' | 'EXPORT';
  quantity: number;
  date: Date;
  supplier?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const materialLogSchema = new Schema<IMaterialLog>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    type: { type: String, enum: ['IMPORT', 'EXPORT'], required: true },
    quantity: { type: Number, required: true },
    date: { type: Date, required: true },
    supplier: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const MaterialLog = mongoose.model<IMaterialLog>('MaterialLog', materialLogSchema);
