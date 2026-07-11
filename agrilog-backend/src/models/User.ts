import mongoose, { Document, Schema } from 'mongoose';

export enum Role {
  FARM = 'FARM',
  ADMIN = 'ADMIN',
  COMPANY = 'COMPANY',
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  allowAdminReset: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: false, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), default: Role.FARM },
    isActive: { type: Boolean, default: true },
    allowAdminReset: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
