import mongoose, { Document, Schema, Types } from './supabaseModel';

export type SeasonStatus = 'PLANNING' | 'IN_PROGRESS' | 'HARVESTING' | 'COMPLETED' | 'ACTIVE' | 'HARVESTED' | 'CANCELLED';

export interface ISeasonSummaryReport {
  generatedAt: Date;
  totalSeedCost: number;
  totalFertilizerCost: number;
  totalFertilizerQty: number;
  fertilizerSummary?: Array<{ name: string; quantity: string; cost: number }>;
  totalPesticideCost: number;
  totalPesticideApplications: number;
  pesticideSummary?: Array<{ name: string; quantity: string; phiDays: number; cost: number }>;
  totalLaborCost: number;
  totalLaborDays: number;
  actualYield: number; // kg
  expectedYield: number; // kg
  yieldAchievementRate: number; // %
  totalCost: number;
  costPerKg: number;
  phiComplianceStatus: 'SAFE' | 'WARNING' | 'CRITICAL';
  phiNotes?: string;
}

export interface ICultivationBoard extends Document {
  farmProfile: Types.ObjectId;
  name: string;
  cropType: string;
  areaSqm: number;
  areaText?: string;
  startDate: Date;
  status: SeasonStatus;
  description?: string;
  expectedHarvestDate?: Date;
  expectedYield?: number;
  seedCost?: number;
  harvestYield?: number;
  harvestDate?: Date;
  completedAt?: Date;
  summaryReport?: ISeasonSummaryReport;
  customColumns: string[];
  groupId?: string;
  hasInitializedEntries?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const cultivationBoardSchema = new Schema<ICultivationBoard>(
  {
    farmProfile: { type: Schema.Types.ObjectId, ref: 'FarmProfile', required: true },
    name: { type: String, required: true },
    cropType: { type: String, required: true },
    areaSqm: { type: Number, required: true },
    areaText: { type: String },
    startDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['PLANNING', 'IN_PROGRESS', 'HARVESTING', 'COMPLETED', 'ACTIVE', 'HARVESTED', 'CANCELLED'], 
      default: 'IN_PROGRESS' 
    },
    description: { type: String },
    expectedHarvestDate: { type: Date },
    expectedYield: { type: Number, default: 0 },
    seedCost: { type: Number, default: 0 },
    harvestYield: { type: Number },
    harvestDate: { type: Date },
    completedAt: { type: Date },
    summaryReport: { type: Schema.Types.Mixed },
    customColumns: [{ type: String }],
    groupId: { type: String },
    hasInitializedEntries: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CultivationBoard = mongoose.model<ICultivationBoard>('CultivationBoard', cultivationBoardSchema);
