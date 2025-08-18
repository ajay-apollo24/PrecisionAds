import { Decimal } from '@prisma/client/runtime/library';

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type CampaignType = 'DISPLAY' | 'VIDEO' | 'NATIVE' | 'SEARCH' | 'SOCIAL' | 'RETARGETING' | 'RTB' | 'PROGRAMMATIC';
export type BudgetType = 'DAILY' | 'LIFETIME' | 'MONTHLY';
export type BidStrategy = 'MANUAL' | 'AUTO_CPC' | 'AUTO_CPM' | 'TARGET_CPA' | 'PREDICTIVE' | 'AI_OPTIMIZED';

export interface CreateCampaignData {
  name: string;
  type: CampaignType;
  startDate?: Date;
  endDate?: Date;
  budget: Decimal;
  budgetType: BudgetType;
  bidStrategy: BidStrategy;
  targetCPM?: Decimal;
  targetCPC?: Decimal;
  targetCPA?: Decimal;
  dailyBudget?: Decimal;
}

export interface UpdateCampaignData {
  name?: string;
  type?: CampaignType;
  startDate?: Date;
  endDate?: Date;
  budget?: Decimal;
  budgetType?: BudgetType;
  bidStrategy?: BidStrategy;
  targetCPM?: Decimal;
  targetCPC?: Decimal;
  targetCPA?: Decimal;
  dailyBudget?: Decimal;
  status?: CampaignStatus;
}

export interface CampaignFilters {
  status?: CampaignStatus;
  type?: CampaignType;
  startDate?: Date;
  endDate?: Date;
}

export interface CampaignWithRelations {
  id: string;
  organizationId: string;
  name: string;
  status: CampaignStatus;
  type: CampaignType;
  startDate: Date | null;
  endDate: Date | null;
  budget: Decimal;
  budgetType: BudgetType;
  bidStrategy: BidStrategy;
  targetCPM: Decimal | null;
  targetCPC: Decimal | null;
  targetCPA: Decimal | null;
  dailyBudget: Decimal | null;
  totalSpent: Decimal;
  impressions: number;
  clicks: number;
  conversions: number;
  createdAt: Date;
  updatedAt: Date;
  ads: AdSummary[];
  audiences: AudienceSummary[];
}

export interface AdSummary {
  id: string;
  name: string;
  creativeType: string;
  status: string;
}

export interface AudienceSummary {
  id: string;
  name: string;
  description: string | null;
  size: number | null;
}

export interface CampaignStats {
  totalAds: number;
  totalSpent: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  ctr: number;
  conversionRate: number;
  cpm: number;
  cpc: number;
  cpa: number;
}

export interface CampaignWithPerformanceScore extends CampaignWithRelations {
  performanceScore: number;
} 