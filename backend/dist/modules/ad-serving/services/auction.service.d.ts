export declare class AuctionService {
    runAuction(adRequestId: string): Promise<{
        winner: string | null;
        winningBid: number;
        clearingPrice: number;
        participants: number;
        auctionData: Record<string, any>;
    }>;
    private getEligibleAds;
    private isAdCompatible;
    private matchesTargeting;
    private collectBids;
    private calculateBid;
    private calculateBaseBid;
    private calculateQualityScore;
    private calculateTargetingScore;
    private recordAuctionResult;
    private matchesGeoLocation;
    private matchesDeviceInfo;
    private calculateGeoScore;
    private calculateDeviceScore;
    private calculateInterestScore;
}
//# sourceMappingURL=auction.service.d.ts.map