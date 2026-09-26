import { CultivationBoard } from '../models/CultivationBoard';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { PesticideBoard } from '../models/PesticideBoard';
import { TrialSetting, ITrialSetting } from '../models/TrialSetting';

export const PLAN_LIMITS = {
  FREE: { columns: 0, products: 1, retentionYears: 1 },
  BASIC: { columns: 10, products: 3, retentionYears: 1 },
  STANDARD: { columns: 15, products: 5, retentionYears: 2 },
  PREMIUM: { columns: 25, products: 15, retentionYears: 3 },
  EXPIRED: { columns: 0, products: 0, retentionYears: 1 },
};

/**
 * Lấy hoặc khởi tạo cấu hình chính sách Dùng thử mặc định
 */
export const getOrCreateTrialSetting = async (): Promise<ITrialSetting> => {
  let setting = await TrialSetting.findOne();
  if (!setting) {
    setting = await TrialSetting.create({
      isEnabled: true,
      durationMonths: 1, // Mặc định 1 tháng miễn phí toàn bộ chức năng
      trialPlan: 'PREMIUM', // Cấp gói cao nhất full chức năng
      lockOnExpiry: true,
    });
  }
  return setting;
};

/**
 * Kiểm tra xem gói cước hoặc gói dùng thử của người dùng đã hết hạn hay chưa
 */
export const isPlanExpired = (profile: any): boolean => {
  if (!profile || !profile.planExpiresAt) return false;
  return new Date(profile.planExpiresAt) < new Date();
};

export const getEffectivePlan = (profile: any) => {
  let effectivePlan = (profile.plan || 'FREE').toUpperCase();
  
  if (profile.planExpiresAt) {
    if (new Date(profile.planExpiresAt) < new Date()) {
      effectivePlan = 'EXPIRED';
    } else if (profile.previousPlan) {
      const prevPlan = profile.previousPlan.toUpperCase();
      const planValues = { FREE: 0, BASIC: 1, STANDARD: 2, PREMIUM: 3 };
      const currentVal = planValues[effectivePlan as keyof typeof planValues] || 1;
      const prevVal = planValues[prevPlan as keyof typeof planValues] || 1;
      if (prevVal > currentVal) {
        effectivePlan = prevPlan;
      }
    }
  }
  return effectivePlan;
};

export const getRetentionDate = (plan: string) => {
  const normalizedPlan = (plan || 'FREE').toUpperCase();
  const years = PLAN_LIMITS[normalizedPlan as keyof typeof PLAN_LIMITS]?.retentionYears || 1;
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
};

export const checkBoardLocked = async (profileId: string, boardId: string, plan: string) => {
  const normalizedPlan = (plan || 'FREE').toUpperCase();
  if (normalizedPlan === 'EXPIRED') {
    return true; // Khóa toàn bộ khi gói cước/dùng thử đã hết hạn
  }
  const planLimits = PLAN_LIMITS[normalizedPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
  let boards: any[] = await CultivationBoard.find({ farmProfile: profileId }, '_id createdAt').sort({ createdAt: 1 }).lean();
  let boardIndex = boards.findIndex(b => b._id.toString() === boardId.toString());
  
  if (boardIndex === -1) {
    boards = await FertilizerBoard.find({ farmProfile: profileId }, '_id createdAt').sort({ createdAt: 1 }).lean();
    boardIndex = boards.findIndex(b => b._id.toString() === boardId.toString());
  }
  
  if (boardIndex === -1) {
    boards = await PesticideBoard.find({ farmProfile: profileId }, '_id createdAt').sort({ createdAt: 1 }).lean();
    boardIndex = boards.findIndex(b => b._id.toString() === boardId.toString());
  }

  if (boardIndex === -1) return false;
  return boardIndex >= planLimits.products;
};
