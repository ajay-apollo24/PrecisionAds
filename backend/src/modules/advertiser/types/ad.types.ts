import { Decimal } from '@prisma/client/runtime/library';
import { JsonValue } from '@prisma/client/runtime/library';

export type CreativeType = 'IMAGE' | 'VIDEO' | 'HTML5' | 'NATIVE' | 'TEXT';
export type AdStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'REJECTED' | 'APPROVED';

export interface CreateAdData {
  campaignId: string;
  name: string;
  creativeType: CreativeType;
  creativeUrl: string;
  landingPageUrl: string;
  weight?: number;
  targeting?: JsonValue;
}

export interface UpdateAdData {
  name?: string;
  creativeType?: CreativeType;
  creativeUrl?: string;
  landingPageUrl?: string;
  weight?: number;
  targeting?: JsonValue;
  status?: AdStatus;
}

export interface AdFilters {
  status?: AdStatus;
  creativeType?: CreativeType;
}

export interface AdWithRelations {
  id: string;
  organizationId: string;
  campaignId: string;
  name: string;
  creativeType: CreativeType;
  creativeUrl: string;
  landingPageUrl: string;
  status: AdStatus;
  weight: number;
  targeting: JsonValue | null;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: Decimal;
  cpc: Decimal;
  cpm: Decimal;
  createdAt: Date;
  updatedAt: Date;
  campaign: CampaignSummary;
}

export interface CampaignSummary {
  id: string;
  name: string;
  status: string;
  type: string;
}

export interface AdStats {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversionRate: number;
}

export interface AdWithPerformanceScore extends AdWithRelations {
  performanceScore: number;
} 