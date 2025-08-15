export type CreativeType = 'IMAGE' | 'VIDEO' | 'HTML5' | 'NATIVE' | 'TEXT';
export type AdStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'REJECTED' | 'APPROVED';
export interface CreateAdData {
    campaignId: string;
    name: string;
    creativeType: CreativeType;
    creativeUrl: string;
    landingPageUrl: string;
    weight?: number;
    targeting?: Record<string, any>;
}
export interface UpdateAdData {
    name?: string;
    creativeType?: CreativeType;
    creativeUrl?: string;
    landingPageUrl?: string;
    weight?: number;
    targeting?: Record<string, any>;
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
    targeting: Record<string, any> | null;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpm: number;
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
//# sourceMappingURL=ad.types.d.ts.map