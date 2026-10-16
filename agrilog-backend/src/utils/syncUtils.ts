import { Types } from '../models/supabaseModel';
import { CultivationBoard } from '../models/CultivationBoard';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { PesticideBoard } from '../models/PesticideBoard';
import { CultivationEntry } from '../models/CultivationEntry';
import { FertilizerEntry } from '../models/FertilizerEntry';
import { PesticideEntry } from '../models/PesticideEntry';

export interface CommonBoardData {
  farmProfile: Types.ObjectId | string;
  name: string;
  cropType: string;
  areaSqm: number;
  areaText?: string;
  startDate: Date | string;
  description?: string;
  groupId: string;
}

export const syncDiaryBoards = async (
  sourceType: 'CULTIVATION' | 'FERTILIZER' | 'PESTICIDE',
  data: CommonBoardData
) => {
  try {
    if (sourceType !== 'CULTIVATION') {
      const existing = await CultivationBoard.findOne({ farmProfile: data.farmProfile, groupId: data.groupId });
      if (!existing) {
        await CultivationBoard.create({ ...data, hasInitializedEntries: true });
      }
    }
    if (sourceType !== 'FERTILIZER') {
      const existing = await FertilizerBoard.findOne({ farmProfile: data.farmProfile, groupId: data.groupId });
      if (!existing) {
        await FertilizerBoard.create({ ...data, hasInitializedEntries: true });
      }
    }
    if (sourceType !== 'PESTICIDE') {
      const existing = await PesticideBoard.findOne({ farmProfile: data.farmProfile, groupId: data.groupId });
      if (!existing) {
        await PesticideBoard.create({ ...data, hasInitializedEntries: true });
      }
    }
  } catch (error) {
    console.error(`Failed to sync diary boards from ${sourceType}:`, error);
  }
};

export const syncUpdateDiaryBoards = async (groupId: string, updateData: Partial<CommonBoardData>) => {
  if (!groupId) return;
  try {
    const cleanData: any = {};
    if (updateData.name !== undefined) cleanData.name = updateData.name;
    if (updateData.cropType !== undefined) cleanData.cropType = updateData.cropType;
    if (updateData.areaSqm !== undefined) cleanData.areaSqm = updateData.areaSqm;
    if (updateData.areaText !== undefined) cleanData.areaText = updateData.areaText;
    if (updateData.startDate !== undefined) cleanData.startDate = updateData.startDate;
    if (updateData.description !== undefined) cleanData.description = updateData.description;

    await Promise.all([
      CultivationBoard.updateMany({ groupId }, { $set: cleanData }),
      FertilizerBoard.updateMany({ groupId }, { $set: cleanData }),
      PesticideBoard.updateMany({ groupId }, { $set: cleanData }),
    ]);
  } catch (error) {
    console.error('Failed to sync update diary boards:', error);
  }
};

export const syncDeleteDiaryBoards = async (groupId: string) => {
  if (!groupId) return;
  try {
    const [cultBoards, fertBoards, pestBoards] = await Promise.all([
      CultivationBoard.find({ groupId }),
      FertilizerBoard.find({ groupId }),
      PesticideBoard.find({ groupId }),
    ]);

    const cultIds = cultBoards.map(b => b._id);
    const fertIds = fertBoards.map(b => b._id);
    const pestIds = pestBoards.map(b => b._id);

    await Promise.all([
      CultivationEntry.deleteMany({ cultivationBoard: { $in: cultIds } }),
      FertilizerEntry.deleteMany({ fertilizerBoard: { $in: fertIds } }),
      PesticideEntry.deleteMany({ pesticideBoard: { $in: pestIds } }),
      CultivationBoard.deleteMany({ groupId }),
      FertilizerBoard.deleteMany({ groupId }),
      PesticideBoard.deleteMany({ groupId }),
    ]);
  } catch (error) {
    console.error('Failed to sync delete diary boards:', error);
  }
};

export const ensureBoardGroup = async (
  board: any,
  boardType: 'CULTIVATION' | 'FERTILIZER' | 'PESTICIDE'
): Promise<string> => {
  try {
    if (!board.groupId) {
      board.groupId = 'gid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      await board.save();
    }

    const commonData: CommonBoardData = {
      farmProfile: board.farmProfile,
      name: board.name,
      cropType: board.cropType,
      areaSqm: board.areaSqm,
      areaText: board.areaText,
      startDate: board.startDate,
      description: board.description,
      groupId: board.groupId,
    };

    await syncDiaryBoards(boardType, commonData);
    return board.groupId;
  } catch (error) {
    console.error('Failed to ensure board group:', error);
    return board.groupId;
  }
};

// --- TẮT ĐỒNG BỘ SINH DÒNG CHÉO THEO YÊU CẦU NGƯỜI DÙNG ---
export const syncCreateDiaryEntry = async (
  sourceType: 'CULTIVATION' | 'FERTILIZER' | 'PESTICIDE',
  sourceBoard: any,
  sourceEntry: any
) => {
  // Không tự động chép dòng sang bảng khác để tránh làm rác và rối nhật ký
  return;
};

export const syncUpdateDiaryEntry = async (
  entryGroupId: string,
  updateData: { date?: Date | string; performer?: string; weather?: string }
) => {
  // Không can thiệp cập nhật chéo giữa các bảng
  return;
};

export const syncDeleteDiaryEntry = async (entryGroupId: string) => {
  // Xóa ở bảng nào chỉ xóa ở đúng bảng đó, không xóa chéo
  return;
};
