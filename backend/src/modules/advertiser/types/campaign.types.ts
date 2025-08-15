export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type CampaignType = 'DISPLAY' | 'VIDEO' | 'NATIVE' | 'SEARCH' | 'SOCIAL' | 'RETARGETING' | 'RTB' | 'PROGRAMMATIC';
export type BudgetType = 'DAILY' | 'LIFETIME' | 'MONTHLY';
export type BidStrategy = 'MANUAL' | 'AUTO_CPC' | 'AUTO_CPM' | 'TARGET_CPA' | 'PREDICTIVE' | 'AI_OPTIMIZED';

export interface CreateCampaignData {
  name: string;
  type: CampaignType;
  startDate?: Date;
  endDate?: Date;
  budget: number;
  budgetType: BudgetType;
  bidStrategy: BidStrategy;
  targetCPM?: number;
  targetCPC?: number;
  targetCPA?: number;
  dailyBudget?: number;
}

export interface UpdateCampaignData {
  name?: string;
  type?: CampaignType;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  budgetType?: BudgetType;
  bidStrategy?: BidStrategy;
  targetCPM?: number;
  targetCPC?: number;
  targetCPA?: number;
  dailyBudget?: number;
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
  budget: number;
  budgetType: BudgetType;
  bidStrategy: BidStrategy;
  targetCPM: number | null;
  targetCPC: number | null;
  targetCPA: number | null;
  dailyBudget: number | null;
  totalSpent: number;
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