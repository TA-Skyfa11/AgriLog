import { CultivationBoard } from '../models/CultivationBoard';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { PesticideBoard } from '../models/PesticideBoard';

export const PLAN_LIMITS = {
  BASIC: { columns: 10, products: 3, retentionYears: 1 },
  STANDARD: { columns: 15, products: 5, retentionYears: 2 },
  PREMIUM: { columns: 25, products: 15, retentionYears: 3 },
};

export const getEffectivePlan = (profile: any) => {
  let effectivePlan = (profile.plan || 'BASIC').toUpperCase();
  
  if (profile.planExpiresAt) {
    if (new Date(profile.planExpiresAt) < new Date()) {
      effectivePlan = 'BASIC';
    } else if (profile.previousPlan) {
      const prevPlan = profile.previousPlan.toUpperCase();
      const planValues = { BASIC: 1, STANDARD: 2, PREMIUM: 3 };
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
  const normalizedPlan = (plan || 'BASIC').toUpperCase();
  const years = PLAN_LIMITS[normalizedPlan as keyof typeof PLAN_LIMITS]?.retentionYears || 1;
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
};

export const checkBoardLocked = async (profileId: string, boardId: string, plan: string) => {
  const normalizedPlan = (plan || 'BASIC').toUpperCase();
  const planLimits = PLAN_LIMITS[normalizedPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.BASIC;
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
