export type AdUnitFormat = 'BANNER' | 'VIDEO' | 'NATIVE' | 'DISPLAY' | 'INTERSTITIAL';
export type AdUnitStatus = 'ACTIVE' | 'INACTIVE' | 'TESTING';
export interface CreateAdUnitData {
    siteId: string;
    name: string;
    size: string;
    format: AdUnitFormat;
    settings?: Record<string, any>;
}
export interface UpdateAdUnitData {
    name?: string;
    size?: string;
    format?: AdUnitFormat;
    status?: AdUnitStatus;
    settings?: Record<string, any>;
}
export interface AdUnitFilters {
    status?: AdUnitStatus;
    format?: AdUnitFormat;
}
export interface AdUnitWithRelations {
    id: string;
    organizationId: string;
    siteId: string;
    name: string;
    size: string;
    format: AdUnitFormat;
    status: AdUnitStatus;
    settings: Record<string, any> | null;
    createdAt: Date;
    updatedAt: Date;
    site: SiteSummary;
    adRequests: AdRequestSummary[];
}
export interface SiteSummary {
    id: string;
    name: string;
    domain: string;
}
export interface AdRequestSummary {
    id: string;
    status: string;
    createdAt: Date;
}
export interface AdUnitStats {
    totalRequests: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
}
export interface AdUnitWithPerformanceScore extends AdUnitWithRelations {
    performanceScore: number;
}
//# sourceMappingURL=ad-unit.types.d.ts.map