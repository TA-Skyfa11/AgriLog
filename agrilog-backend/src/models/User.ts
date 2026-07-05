import mongoose, { Document, Schema } from 'mongoose';

export enum Role {
  FARM = 'FARM',
  ADMIN = 'ADMIN',
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), default: Role.FARM },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
