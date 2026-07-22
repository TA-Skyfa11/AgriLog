import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  farmProfile: Types.ObjectId;
  title: string;
  dueDate: Date;
  status: 'PENDING' | 'COMPLETED';
  notes?: string;
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  recurrenceCustomDays?: number;
  recurrenceEndDate?: Date;
  parentTaskId?: Types.ObjectId;
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
    recurrence: { type: String, enum: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'], default: 'NONE' },
    recurrenceCustomDays: { type: Number },
    recurrenceEndDate: { type: Date },
    parentTaskId: { type: Schema.Types.ObjectId, ref: 'Task' },
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>('Task', taskSchema);
