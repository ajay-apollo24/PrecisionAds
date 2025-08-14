import { prisma } from '../../../shared/database/prisma';
import { AdRequestData, AdSelectionResult, TargetingCriteria } from '../types/ad-request.types';

export class AdServingService {
  /**
   * Process an ad request and select the best ad
   */
  async processAdRequest(requestData: AdRequestData): Promise<AdSelectionResult> {
    try {
      // Validate the request
      const validation = this.validateAdRequest(requestData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
          adId: null,
          bidAmount: null
        };
      }

      // Get eligible ads for the ad unit
      const eligibleAds = await this.getEligibleAds(
        requestData.adUnitId,
        requestData.organizationId,
        requestData.targeting
      );

      if (eligibleAds.length === 0) {
        return {
          success: false,
          error: 'No eligible ads found',
          adId: null,
          bidAmount: null
        };
      }

      // Select the best ad using auction logic
      const selectedAd = await this.selectBestAd(eligibleAds, requestData);

      // Record the ad request
      await this.recordAdRequest(requestData, selectedAd.adId);

      return {
        success: true,
        adId: selectedAd.adId,
        bidAmount: selectedAd.bidAmount,
        cpm: selectedAd.cpm,
        targetingScore: selectedAd.targetingScore
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        adId: null,
        bidAmount: null
      };
    }
  }

  /**
   * Get eligible ads for an ad unit based on targeting criteria
   */
  private async getEligibleAds(
    adUnitId: string,
    organizationId: string,
    targeting?: TargetingCriteria
  ) {
    // Get the ad unit to understand its format and settings
    const adUnit = await prisma.adUnit.findFirst({
      where: { id: adUnitId, organizationId },
      include: { site: true }
    });

    if (!adUnit) {
      throw new Error('Ad unit not found');
    }

    // Find active campaigns with ads that match the ad unit format
    const eligibleAds = await prisma.advertiserAd.findMany({
      where: {
        status: 'ACTIVE',
        campaign: {
          status: 'ACTIVE',
          organization: {
            orgType: 'ADVERTISER'
          }
        }
      },
      include: {
        campaign: true,
        organization: true
      }
    });

    // Filter ads based on targeting criteria
    return eligibleAds.filter(ad => 
      this.matchesTargeting(ad, targeting, adUnit)
    );
  }

  /**
   * Select the best ad using auction logic
   */
  private async selectBestAd(eligibleAds: any[], requestData: AdRequestData) {
    // Calculate scores for each ad
    const adsWithScores = eligibleAds.map(ad => {
      const targetingScore = this.calculateTargetingScore(ad, requestData.targeting);
      const qualityScore = this.calculateQualityScore(ad);
      const bidScore = this.calculateBidScore(ad);
      
      const totalScore = (targetingScore * 0.4) + (qualityScore * 0.3) + (bidScore * 0.3);
      
      return {
        ...ad,
        targetingScore,
        qualityScore,
        bidScore,
        totalScore
      };
    });

    // Sort by total score and select the winner
    adsWithScores.sort((a, b) => b.totalScore - a.totalScore);
    const winner = adsWithScores[0];

    // Calculate bid amount based on second-highest bid (Vickrey auction)
    const secondHighestBid = adsWithScores.length > 1 ? adsWithScores[1].totalScore : winner.totalScore * 0.8;

    return {
      adId: winner.id,
      bidAmount: secondHighestBid,
      cpm: winner.campaign.targetCPM || 0,
      targetingScore: winner.targetingScore
    };
  }

  /**
   * Check if an ad matches the targeting criteria
   */
  private matchesTargeting(ad: any, targeting?: TargetingCriteria, adUnit?: any): boolean {
    if (!targeting) return true;

    // Check geographic targeting
    if (targeting.geoLocation && ad.targeting?.geoLocation) {
      if (!this.matchesGeoLocation(targeting.geoLocation, ad.targeting.geoLocation)) {
        return false;
      }
    }

    // Check device targeting
    if (targeting.deviceInfo && ad.targeting?.deviceInfo) {
      if (!this.matchesDeviceInfo(targeting.deviceInfo, ad.targeting.deviceInfo)) {
        return false;
      }
    }

    // Check ad unit format compatibility
    if (adUnit && ad.targeting?.formats) {
      if (!ad.targeting.formats.includes(adUnit.format)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate targeting score for an ad
   */
  private calculateTargetingScore(ad: any, targeting?: TargetingCriteria): number {
    if (!targeting) return 0.5; // Default score if no targeting

    let score = 0;
    let totalChecks = 0;

    // Geographic targeting
    if (targeting.geoLocation && ad.targeting?.geoLocation) {
      score += this.calculateGeoScore(targeting.geoLocation, ad.targeting.geoLocation);
      totalChecks++;
    }

    // Device targeting
    if (targeting.deviceInfo && ad.targeting?.deviceInfo) {
      score += this.calculateDeviceScore(targeting.deviceInfo, ad.targeting.deviceInfo);
      totalChecks++;
    }

    // Interest targeting
    if (targeting.interests && ad.targeting?.interests) {
      score += this.calculateInterestScore(targeting.interests, ad.targeting.interests);
      totalChecks++;
    }

    return totalChecks > 0 ? score / totalChecks : 0.5;
  }

  /**
   * Calculate quality score for an ad
   */
  private calculateQualityScore(ad: any): number {
    let score = 0;

    // CTR-based score
    if (ad.ctr > 0) {
      score += Math.min(ad.ctr * 10, 0.4); // Max 0.4 for CTR
    }

    // Conversion rate score
    if (ad.conversions > 0 && ad.clicks > 0) {
      const conversionRate = ad.conversions / ad.clicks;
      score += Math.min(conversionRate * 0.3, 0.3); // Max 0.3 for conversion rate
    }

    // Ad age score (newer ads get slightly higher scores)
    const adAge = Date.now() - ad.createdAt.getTime();
    const ageScore = Math.max(0, 1 - (adAge / (30 * 24 * 60 * 60 * 1000))); // 30 days
    score += ageScore * 0.1; // Max 0.1 for age

    return Math.min(score, 1);
  }

  /**
   * Calculate bid score for an ad
   */
  private calculateBidScore(ad: any): number {
    if (!ad.campaign.targetCPM) return 0.5;

    // Normalize bid amount (assuming typical CPM range is $0.50 to $50)
    const normalizedBid = Math.min(ad.campaign.targetCPM / 50, 1);
    return normalizedBid;
  }

  /**
   * Record the ad request in the database
   */
  private async recordAdRequest(requestData: AdRequestData, adId: string) {
    await prisma.adRequest.create({
      data: {
        organizationId: requestData.organizationId,
        siteId: requestData.siteId,
        adUnitId: requestData.adUnitId,
        requestId: requestData.requestId,
        userAgent: requestData.userAgent,
        ipAddress: requestData.ipAddress,
        geoLocation: requestData.geoLocation,
        deviceInfo: requestData.deviceInfo,
        targeting: requestData.targeting,
        status: 'PROCESSED',
        servedAdId: adId
      }
    });
  }

  /**
   * Validate ad request data
   */
  private validateAdRequest(requestData: AdRequestData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!requestData.organizationId) errors.push('Organization ID is required');
    if (!requestData.siteId) errors.push('Site ID is required');
    if (!requestData.adUnitId) errors.push('Ad unit ID is required');
    if (!requestData.requestId) errors.push('Request ID is required');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper methods for targeting calculations
  private matchesGeoLocation(requestGeo: any, adGeo: any): boolean {
    // Simplified geographic matching - in production, use proper geo-location services
    return requestGeo.country === adGeo.country;
  }

  private matchesDeviceInfo(requestDevice: any, adDevice: any): boolean {
    // Simplified device matching
    return requestDevice.type === adDevice.type;
  }

  private calculateGeoScore(requestGeo: any, adGeo: any): number {
    if (requestGeo.country === adGeo.country) return 1;
    if (requestGeo.region === adGeo.region) return 0.8;
    return 0.3;
  }

  private calculateDeviceScore(requestDevice: any, adDevice: any): number {
    if (requestDevice.type === adDevice.type) return 1;
    return 0.5;
  }

  private calculateInterestScore(requestInterests: string[], adInterests: string[]): number {
    const intersection = requestInterests.filter(interest => adInterests.includes(interest));
    return intersection.length / Math.max(requestInterests.length, adInterests.length);
  }
} 