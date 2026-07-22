import mongoose, { Types } from 'mongoose';
import { CultivationBoard } from '../models/CultivationBoard';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { PesticideBoard } from '../models/PesticideBoard';

interface CommonBoardData {
  farmProfile: Types.ObjectId;
  name: string;
  cropType: string;
  areaSqm: number;
  startDate: Date;
  groupId: string;
}

export const syncDiaryBoards = async (sourceType: 'CULTIVATION' | 'FERTILIZER' | 'PESTICIDE', data: CommonBoardData) => {
  try {
    if (sourceType !== 'CULTIVATION') {
      await CultivationBoard.create(data);
    }
    if (sourceType !== 'FERTILIZER') {
      await FertilizerBoard.create(data);
    }
    if (sourceType !== 'PESTICIDE') {
      await PesticideBoard.create(data);
    }
  } catch (error) {
    console.error(`Failed to sync diary boards from ${sourceType}:`, error);
  }
};
