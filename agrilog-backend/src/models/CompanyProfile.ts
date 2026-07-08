import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICompanyProfile extends Document {
  user: Types.ObjectId;
  companyName: string;
  address: string;
  contactPhone: string;
  businessType: string;
  taxCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const companyProfileSchema = new Schema<ICompanyProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, required: true },
    address: { type: String, required: false },
    contactPhone: { type: String, required: false },
    businessType: { type: String, required: false },
    taxCode: { type: String, required: false },
  },
  { timestamps: true }
);

export const CompanyProfile = mongoose.model<ICompanyProfile>('CompanyProfile', companyProfileSchema);
