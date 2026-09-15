import mongoose, { Types } from 'mongoose';
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
        await CultivationBoard.create(data);
      }
    }
    if (sourceType !== 'FERTILIZER') {
      const existing = await FertilizerBoard.findOne({ farmProfile: data.farmProfile, groupId: data.groupId });
      if (!existing) {
        await FertilizerBoard.create(data);
      }
    }
    if (sourceType !== 'PESTICIDE') {
      const existing = await PesticideBoard.findOne({ farmProfile: data.farmProfile, groupId: data.groupId });
      if (!existing) {
        await PesticideBoard.create(data);
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

export const syncCreateDiaryEntry = async (
  sourceType: 'CULTIVATION' | 'FERTILIZER' | 'PESTICIDE',
  sourceBoard: any,
  sourceEntry: any
) => {
  try {
    const groupId = sourceBoard.groupId;
    if (!groupId) return;

    const entryGroupId = sourceEntry.entryGroupId;
    if (!entryGroupId) return;

    const entryDate = sourceEntry.date ? new Date(sourceEntry.date) : new Date();

    if (sourceType === 'CULTIVATION') {
      // Sync to Fertilizer
      const fertBoard = await FertilizerBoard.findOne({ farmProfile: sourceBoard.farmProfile, groupId });
      if (fertBoard) {
        const existing = await FertilizerEntry.findOne({ fertilizerBoard: fertBoard._id, entryGroupId });
        if (!existing) {
          await FertilizerEntry.create({
            fertilizerBoard: fertBoard._id,
            date: entryDate,
            performer: sourceEntry.performer || '',
            weather: sourceEntry.weather || '',
            notes: sourceEntry.notes ? sourceEntry.notes : (sourceEntry.activityName && sourceEntry.activityName !== 'Chưa đặt tên' ? `Đồng bộ từ canh tác: ${sourceEntry.activityName}` : ''),
            entryGroupId,
          });
        }
      }

      // Sync to Pesticide
      const pestBoard = await PesticideBoard.findOne({ farmProfile: sourceBoard.farmProfile, groupId });
      if (pestBoard) {
        const existing = await PesticideEntry.findOne({ pesticideBoard: pestBoard._id, entryGroupId });
        if (!existing) {
          await PesticideEntry.create({
            pesticideBoard: pestBoard._id,
            date: entryDate,
            performer: sourceEntry.performer || '',
            weather: sourceEntry.weather || '',
            notes: sourceEntry.notes ? sourceEntry.notes : (sourceEntry.activityName && sourceEntry.activityName !== 'Chưa đặt tên' ? `Đồng bộ từ canh tác: ${sourceEntry.activityName}` : ''),
            entryGroupId,
          });
        }
      }
    } else if (sourceType === 'FERTILIZER') {
      // Sync to Cultivation
      const cultBoard = await CultivationBoard.findOne({ farmProfile: sourceBoard.farmProfile, groupId });
      if (cultBoard) {
        const existing = await CultivationEntry.findOne({ cultivationBoard: cultBoard._id, entryGroupId });
        if (!existing) {
          const activity = sourceEntry.materialName ? `Bón phân: ${sourceEntry.materialName}` : 'Bón phân';
          await CultivationEntry.create({
            cultivationBoard: cultBoard._id,
            date: entryDate,
            activityName: activity,
            performer: sourceEntry.performer || '',
            weather: sourceEntry.weather || '',
            notes: sourceEntry.notes || '',
            entryGroupId,
          });
        }
      }

      // Sync to Pesticide
      const pestBoard = await PesticideBoard.findOne({ farmProfile: sourceBoard.farmProfile, groupId });
      if (pestBoard) {
        const existing = await PesticideEntry.findOne({ pesticideBoard: pestBoard._id, entryGroupId });
        if (!existing) {
          await PesticideEntry.create({
            pesticideBoard: pestBoard._id,
            date: entryDate,
            performer: sourceEntry.performer || '',
            weather: sourceEntry.weather || '',
            notes: sourceEntry.notes ? sourceEntry.notes : (sourceEntry.materialName ? `Đồng bộ từ bón phân: ${sourceEntry.materialName}` : ''),
            entryGroupId,
          });
        }
      }
    } else if (sourceType === 'PESTICIDE') {
      // Sync to Cultivation
      const cultBoard = await CultivationBoard.findOne({ farmProfile: sourceBoard.farmProfile, groupId });
      if (cultBoard) {
        const existing = await CultivationEntry.findOne({ cultivationBoard: cultBoard._id, entryGroupId });
        if (!existing) {
          const activity = sourceEntry.materialName
            ? `Phun thuốc: ${sourceEntry.materialName}`
            : (sourceEntry.targetPest ? `Phun thuốc trừ ${sourceEntry.targetPest}` : 'Phun thuốc');
          await CultivationEntry.create({
            cultivationBoard: cultBoard._id,
            date: entryDate,
            activityName: activity,
            performer: sourceEntry.performer || '',
            weather: sourceEntry.weather || '',
            notes: sourceEntry.notes || '',
            entryGroupId,
          });
        }
      }

      // Sync to Fertilizer
      const fertBoard = await FertilizerBoard.findOne({ farmProfile: sourceBoard.farmProfile, groupId });
      if (fertBoard) {
        const existing = await FertilizerEntry.findOne({ fertilizerBoard: fertBoard._id, entryGroupId });
        if (!existing) {
          await FertilizerEntry.create({
            fertilizerBoard: fertBoard._id,
            date: entryDate,
            performer: sourceEntry.performer || '',
            weather: sourceEntry.weather || '',
            notes: sourceEntry.notes ? sourceEntry.notes : (sourceEntry.materialName ? `Đồng bộ từ phun thuốc: ${sourceEntry.materialName}` : ''),
            entryGroupId,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Failed to sync diary entries from ${sourceType}:`, error);
  }
};

export const syncUpdateDiaryEntry = async (
  entryGroupId: string,
  updateData: { date?: Date | string; performer?: string; weather?: string }
) => {
  if (!entryGroupId) return;
  try {
    const cleanData: any = {};
    if (updateData.date !== undefined) cleanData.date = new Date(updateData.date);
    if (updateData.performer !== undefined) cleanData.performer = updateData.performer;
    if (updateData.weather !== undefined) cleanData.weather = updateData.weather;

    if (Object.keys(cleanData).length > 0) {
      await Promise.all([
        CultivationEntry.updateMany({ entryGroupId }, { $set: cleanData }),
        FertilizerEntry.updateMany({ entryGroupId }, { $set: cleanData }),
        PesticideEntry.updateMany({ entryGroupId }, { $set: cleanData }),
      ]);
    }
  } catch (error) {
    console.error('Failed to sync update diary entry:', error);
  }
};

export const syncDeleteDiaryEntry = async (entryGroupId: string) => {
  if (!entryGroupId) return;
  try {
    await Promise.all([
      CultivationEntry.deleteMany({ entryGroupId }),
      FertilizerEntry.deleteMany({ entryGroupId }),
      PesticideEntry.deleteMany({ entryGroupId }),
    ]);
  } catch (error) {
    console.error('Failed to sync delete diary entry:', error);
  }
};
