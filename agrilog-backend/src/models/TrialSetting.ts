import mongoose, { Document, Schema, Types } from './supabaseModel';

export interface ITrialSetting extends Document {
  isEnabled: boolean;
  durationMonths: number;
  trialPlan: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ALL';
  lockOnExpiry: boolean;
  expiryAction: 'SWITCH_TO_FREE' | 'LOCK';
  trialPromptMessage: string;
  expiryNotificationMessage: string;
  requirePlanSelection: boolean;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const trialSettingSchema = new Schema<ITrialSetting>(
  {
    isEnabled: { type: Boolean, default: true },
    durationMonths: { type: Number, default: 6, min: 1, max: 36 },
    trialPlan: {
      type: String,
      enum: ['BASIC', 'STANDARD', 'PREMIUM', 'ALL'],
      default: 'PREMIUM',
    },
    lockOnExpiry: { type: Boolean, default: false },
    expiryAction: {
      type: String,
      enum: ['SWITCH_TO_FREE', 'LOCK'],
      default: 'SWITCH_TO_FREE',
    },
    trialPromptMessage: {
      type: String,
      default:
        'Chào mừng bạn đến với AgriLog! Nông trại của bạn đã được kích hoạt gói dùng thử miễn phí.',
    },
    expiryNotificationMessage: {
      type: String,
      default:
        'Thời hạn dùng thử miễn phí của bạn đã kết thúc. Tài khoản đã được chuyển về gói Miễn phí với các chức năng cơ bản (tối đa 1 bảng mỗi loại nhật ký, không xuất Excel/PDF và không tải ảnh). Hãy nâng cấp gói cước bất cứ lúc nào để mở rộng không giới hạn!',
    },
    requirePlanSelection: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const TrialSetting = mongoose.model<ITrialSetting>('TrialSetting', trialSettingSchema);
