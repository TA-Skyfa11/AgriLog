import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  farmProfile: Types.ObjectId;
  title: string;
  dueDate: Date;
  status: 'PENDING' | 'COMPLETED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    farmProfile: { type: Schema.Types.ObjectId, ref: 'FarmProfile', required: true },
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['PENDING', 'COMPLETED'], default: 'PENDING' },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>('Task', taskSchema);
