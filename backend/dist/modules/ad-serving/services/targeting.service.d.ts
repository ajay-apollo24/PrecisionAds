export declare class TargetingService {
    evaluateTargeting(adId: string, userContext: {
        geoLocation?: any;
        deviceInfo?: any;
        interests?: string[];
        demographics?: any;
        behaviors?: any[];
    }): Promise<{
        matches: boolean;
        score: number;
        breakdown: Record<string, any>;
        reasons: string[];
    }>;
    private evaluateGeographicTargeting;
    private evaluateDeviceTargeting;
    private evaluateInterestTargeting;
    private evaluateDemographicTargeting;
    private evaluateBehavioralTargeting;
    private generateTargetingReasons;
    private calculateDistance;
    private toRadians;
    private matchesScreenSize;
    private matchesAgeRange;
    private matchesIncomeRange;
    private calculateFrequencyScore;
}
//# sourceMappingURL=targeting.service.d.ts.map