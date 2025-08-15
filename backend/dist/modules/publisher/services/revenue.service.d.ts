import { EarningsFilters, EarningsSummary, RevenueStats } from '../types/earnings.types';
export declare class RevenueService {
    getSiteEarnings(siteId: string, organizationId: string, filters?: EarningsFilters): Promise<RevenueStats>;
    getOrganizationEarnings(organizationId: string, filters?: EarningsFilters): Promise<EarningsSummary>;
    getEarningsBreakdown(organizationId: string, period: 'daily' | 'weekly' | 'monthly', startDate: Date, endDate: Date): Promise<any[]>;
    private calculateRevenueStats;
    private getTopPerformingSites;
    calculateRevenueProjections(organizationId: string, days?: number): Promise<{
        projectedRevenue: number;
        confidence: number;
        factors: any;
    }>;
    getRevenueAlerts(organizationId: string): Promise<any[]>;
}
//# sourceMappingURL=revenue.service.d.ts.map