export interface EarningsFilters {
    startDate?: Date;
    endDate?: Date;
    siteId?: string;
    groupBy?: 'daily' | 'weekly' | 'monthly';
}
export interface RevenueStats {
    totalImpressions: number;
    totalClicks: number;
    totalRevenue: number;
    averageCPM: number;
    averageCPC: number;
    ctr: number;
    totalDays: number;
}
export interface EarningsSummary {
    totalStats: RevenueStats;
    topPerformingSites: TopPerformingSite[];
    siteCount: number;
    averageRevenuePerSite: number;
}
export interface TopPerformingSite {
    id: string;
    name: string;
    domain: string;
    totalRevenue: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
}
export interface EarningsBreakdown {
    period: string;
    totalImpressions: number;
    totalClicks: number;
    totalRevenue: number;
    avgCpm: number;
    avgCpc: number;
}
export interface RevenueProjection {
    projectedRevenue: number;
    confidence: number;
    factors: {
        dailyAverage: number;
        growthRate: number;
        dataPoints: number;
        period: number;
    };
}
export interface RevenueAlert {
    type: 'REVENUE_DROP' | 'REVENUE_SPIKE' | 'LOW_PERFORMANCE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    message: string;
    revenueChange?: number;
    currentRevenue?: number;
    previousRevenue?: number;
}
//# sourceMappingURL=earnings.types.d.ts.map