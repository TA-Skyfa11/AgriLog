import mongoose, { Document, Schema, Types } from './supabaseModel';

export interface ICooperative extends Document {
  name: string;
  code: string;
  manager: Types.ObjectId;
  address?: string;
  contactPhone?: string;
  email?: string;
  establishedYear?: number;
  certificationStandards?: string[];
  description?: string;
  members: Types.ObjectId[]; // Array of FarmProfile IDs
  createdAt: Date;
  updatedAt: Date;
}

const cooperativeSchema = new Schema<ICooperative>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    address: { type: String },
    contactPhone: { type: String },
    email: { type: String },
    establishedYear: { type: Number },
    certificationStandards: [{ type: String }],
    description: { type: String },
    members: [{ type: Schema.Types.ObjectId, ref: 'FarmProfile' }],
  },
  { timestamps: true }
);

export const Cooperative = mongoose.model<ICooperative>('Cooperative', cooperativeSchema);
