import { CreateSiteData, UpdateSiteData, SiteFilters, SiteWithRelations } from '../types/site.types';
export declare class SiteService {
    getSites(organizationId: string, filters?: SiteFilters): Promise<SiteWithRelations[]>;
    getSiteById(id: string, organizationId: string): Promise<SiteWithRelations | null>;
    createSite(data: CreateSiteData, organizationId: string): Promise<SiteWithRelations>;
    updateSite(id: string, data: UpdateSiteData, organizationId: string): Promise<SiteWithRelations>;
    deleteSite(id: string, organizationId: string): Promise<SiteWithRelations>;
    getSiteStats(siteId: string, organizationId: string, startDate?: Date, endDate?: Date): Promise<{
        totalImpressions: number;
        totalClicks: number;
        totalRevenue: number | import("@prisma/client/runtime/library").Decimal;
        activeAdUnits: number;
        totalAdRequests: number;
        ctr: number;
    }>;
    getTopPerformingSites(organizationId: string, limit?: number): Promise<SiteWithRelations[]>;
}
//# sourceMappingURL=site.service.d.ts.map