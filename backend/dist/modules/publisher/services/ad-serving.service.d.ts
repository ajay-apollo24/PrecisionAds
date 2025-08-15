import { AdRequestData, AdSelectionResult } from '../types/ad-request.types';
export declare class AdServingService {
    processAdRequest(requestData: AdRequestData): Promise<AdSelectionResult>;
    private getEligibleAds;
    private selectBestAd;
    private matchesTargeting;
    private calculateTargetingScore;
    private calculateQualityScore;
    private calculateBidScore;
    private recordAdRequest;
    private validateAdRequest;
    private matchesGeoLocation;
    private matchesDeviceInfo;
    private calculateGeoScore;
    private calculateDeviceScore;
    private calculateInterestScore;
}
//# sourceMappingURL=ad-serving.service.d.ts.map