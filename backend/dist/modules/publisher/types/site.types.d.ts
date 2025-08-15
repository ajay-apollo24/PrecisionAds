export type PublisherSiteStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
export interface CreateSiteData {
    name: string;
    domain: string;
    settings?: Record<string, any>;
}
export interface UpdateSiteData {
    name?: string;
    domain?: string;
    status?: PublisherSiteStatus;
    settings?: Record<string, any>;
}
export interface SiteFilters {
    status?: PublisherSiteStatus;
    domain?: string;
}
export interface SiteWithRelations {
    id: string;
    organizationId: string;
    name: string;
    domain: string;
    status: PublisherSiteStatus;
    settings: Record<string, any> | null;
    createdAt: Date;
    updatedAt: Date;
    adUnits: AdUnitSummary[];
    earnings: EarningSummary[];
}
export interface AdUnitSummary {
    id: string;
    name: string;
    format: string;
    status: string;
}
export interface EarningSummary {
    date: Date;
    revenue: number;
    impressions: number;
    clicks: number;
}
export interface SiteStats {
    totalImpressions: number;
    totalClicks: number;
    totalRevenue: number;
    activeAdUnits: number;
    totalAdRequests: number;
    ctr: number;
}
export interface SiteWithPerformanceScore extends SiteWithRelations {
    performanceScore: number;
}
//# sourceMappingURL=site.types.d.ts.map