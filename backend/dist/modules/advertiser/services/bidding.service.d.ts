export declare class BiddingService {
    calculateOptimalBid(campaignId: string, organizationId: string, adUnitId: string, targetingScore?: number): Promise<{
        bidAmount: number;
        confidence: number;
        factors: Record<string, any>;
    }>;
    private getHistoricalPerformance;
    private calculateBaseBid;
    private calculatePerformanceMultiplier;
    private calculateTargetingMultiplier;
    private calculateBudgetMultiplier;
    private calculateConfidence;
    private getFormatMultiplier;
    simulateRTBAuction(campaignId: string, organizationId: string, adUnitId: string, competitors?: number): Promise<{
        won: boolean;
        bidAmount: number;
        clearingPrice: number;
        position: number;
        competitors: number;
    }>;
}
//# sourceMappingURL=bidding.service.d.ts.map