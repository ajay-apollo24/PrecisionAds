import { prisma } from '../../../shared/database/prisma';

export class AuctionService {
  /**
   * Run a real-time bidding auction for an ad request
   */
  async runAuction(adRequestId: string): Promise<{
    winner: string | null;
    winningBid: number;
    clearingPrice: number;
    participants: number;
    auctionData: Record<string, any>;
  }> {
    try {
      // Get the ad request
      const adRequest = await prisma.adRequest.findUnique({
        where: { id: adRequestId },
        include: {
          adUnit: {
            include: {
              site: true
            }
          }
        }
      });

      if (!adRequest) {
        throw new Error('Ad request not found');
      }

      // Get eligible ads for this ad unit
      const eligibleAds = await this.getEligibleAds(adRequest.adUnitId, adRequest.organizationId);

      if (eligibleAds.length === 0) {
        return {
          winner: null,
          winningBid: 0,
          clearingPrice: 0,
          participants: 0,
          auctionData: {
            message: 'No eligible ads found',
            adRequestId,
            adUnitId: adRequest.adUnitId
          }
        };
      }

      // Collect bids from all eligible ads
      const bids = await this.collectBids(eligibleAds, adRequest);

      if (bids.length === 0) {
        return {
          winner: null,
          winningBid: 0,
          clearingPrice: 0,
          participants: 0,
          auctionData: {
            message: 'No valid bids received',
            adRequestId,
            adUnitId: adRequest.adUnitId
          }
        };
      }

      // Sort bids by total score (bid amount + quality score)
      bids.sort((a, b) => b.totalScore - a.totalScore);

      // Determine winner (highest total score)
      const winner = bids[0];
      
      // Calculate clearing price (second-highest bid in Vickrey auction)
      const clearingPrice = bids.length > 1 ? bids[1].totalScore : winner.totalScore;

      // Record the auction result
      await this.recordAuctionResult(adRequestId, winner.adId, winner.bidAmount, clearingPrice);

      return {
        winner: winner.adId,
        winningBid: winner.bidAmount,
        clearingPrice,
        participants: bids.length,
        auctionData: {
          adRequestId,
          adUnitId: adRequest.adUnitId,
          siteId: adRequest.siteId,
          totalBids: bids.length,
          bidRange: {
            min: Math.min(...bids.map(b => b.bidAmount)),
            max: Math.max(...bids.map(b => b.bidAmount))
          },
          qualityScores: bids.map(b => ({
            adId: b.adId,
            qualityScore: b.qualityScore,
            targetingScore: b.targetingScore
          }))
        }
      };
    } catch (error) {
      throw new Error(`Auction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get eligible ads for an ad unit
   */
  private async getEligibleAds(adUnitId: string, organizationId: string) {
    const adUnit = await prisma.adUnit.findFirst({
      where: { id: adUnitId },
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

    // Filter ads based on format compatibility and targeting
    return eligibleAds.filter(ad => 
      this.isAdCompatible(ad, adUnit) && 
      this.matchesTargeting(ad, adUnit)
    );
  }

  /**
   * Check if an ad is compatible with the ad unit
   */
  private isAdCompatible(ad: any, adUnit: any): boolean {
    // Check format compatibility
    if (ad.targeting?.formats && !ad.targeting.formats.includes(adUnit.format)) {
      return false;
    }

    // Check size compatibility (simplified)
    if (ad.targeting?.sizes && !ad.targeting.sizes.includes(adUnit.size)) {
      return false;
    }

    return true;
  }

  /**
   * Check if an ad matches the targeting criteria
   */
  private matchesTargeting(ad: any, adUnit: any): boolean {
    if (!ad.targeting) return true;

    // Check geographic targeting
    if (ad.targeting.geoLocation && adUnit.site.geoLocation) {
      if (!this.matchesGeoLocation(ad.targeting.geoLocation, adUnit.site.geoLocation)) {
        return false;
      }
    }

    // Check device targeting
    if (ad.targeting.deviceInfo && adUnit.site.deviceInfo) {
      if (!this.matchesDeviceInfo(ad.targeting.deviceInfo, adUnit.site.deviceInfo)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Collect bids from eligible ads
   */
  private async collectBids(eligibleAds: any[], adRequest: any) {
    const bids = [];

    for (const ad of eligibleAds) {
      try {
        const bid = await this.calculateBid(ad, adRequest);
        if (bid) {
          bids.push(bid);
        }
      } catch (error) {
        console.error(`Error calculating bid for ad ${ad.id}:`, error);
        continue;
      }
    }

    return bids;
  }

  /**
   * Calculate bid for a specific ad
   */
  private async calculateBid(ad: any, adRequest: any) {
    // Get campaign details
    const campaign = ad.campaign;
    
    // Calculate base bid based on campaign strategy
    let baseBid = this.calculateBaseBid(campaign);
    
    // Apply quality score multiplier
    const qualityScore = this.calculateQualityScore(ad);
    const qualityMultiplier = 0.5 + (qualityScore * 0.5); // 0.5 to 1.0 range
    
    // Apply targeting score multiplier
    const targetingScore = this.calculateTargetingScore(ad, adRequest);
    const targetingMultiplier = 0.7 + (targetingScore * 0.6); // 0.7 to 1.3 range
    
    // Calculate final bid
    const finalBid = baseBid * qualityMultiplier * targetingMultiplier;
    
    // Calculate total score (bid amount + quality score)
    const totalScore = finalBid + (qualityScore * 10); // Quality score weighted by 10
    
    return {
      adId: ad.id,
      bidAmount: finalBid,
      qualityScore,
      targetingScore,
      totalScore,
      campaignId: campaign.id,
      organizationId: ad.organizationId
    };
  }

  /**
   * Calculate base bid based on campaign strategy
   */
  private calculateBaseBid(campaign: any): number {
    switch (campaign.bidStrategy) {
      case 'MANUAL':
        return campaign.targetCPM ? Number(campaign.targetCPM) / 1000 : 0.01;
      case 'AUTO_CPC':
        return campaign.targetCPC ? Number(campaign.targetCPC) : 1.50;
      case 'AUTO_CPM':
        return campaign.targetCPM ? Number(campaign.targetCPM) / 1000 : 0.003;
      case 'TARGET_CPA':
        return campaign.targetCPA ? Number(campaign.targetCPA) * 0.1 : 0.50;
      case 'PREDICTIVE':
        return campaign.targetCPM ? Number(campaign.targetCPM) / 1000 * 1.2 : 0.01;
      case 'AI_OPTIMIZED':
        return campaign.targetCPM ? Number(campaign.targetCPM) / 1000 * 1.5 : 0.01;
      default:
        return 0.01;
    }
  }

  /**
   * Calculate quality score for an ad
   */
  private calculateQualityScore(ad: any): number {
    let score = 0.5; // Base score

    // CTR-based score
    if (ad.ctr > 0) {
      score += Math.min(ad.ctr * 10, 0.3); // Max 0.3 for CTR
    }

    // Conversion rate score
    if (ad.conversions > 0 && ad.clicks > 0) {
      const conversionRate = ad.conversions / ad.clicks;
      score += Math.min(conversionRate * 0.2, 0.2); // Max 0.2 for conversion rate
    }

    // Ad age score (newer ads get slightly higher scores)
    const adAge = Date.now() - ad.createdAt.getTime();
    const ageScore = Math.max(0, 1 - (adAge / (30 * 24 * 60 * 60 * 1000))); // 30 days
    score += ageScore * 0.1; // Max 0.1 for age

    return Math.min(score, 1);
  }

  /**
   * Calculate targeting score for an ad
   */
  private calculateTargetingScore(ad: any, adRequest: any): number {
    if (!ad.targeting) return 0.5;

    let score = 0;
    let totalChecks = 0;

    // Geographic targeting
    if (ad.targeting.geoLocation && adRequest.geoLocation) {
      score += this.calculateGeoScore(ad.targeting.geoLocation, adRequest.geoLocation);
      totalChecks++;
    }

    // Device targeting
    if (ad.targeting.deviceInfo && adRequest.deviceInfo) {
      score += this.calculateDeviceScore(ad.targeting.deviceInfo, adRequest.deviceInfo);
      totalChecks++;
    }

    // Interest targeting
    if (ad.targeting.interests && adRequest.targeting?.interests) {
      score += this.calculateInterestScore(ad.targeting.interests, adRequest.targeting.interests);
      totalChecks++;
    }

    return totalChecks > 0 ? score / totalChecks : 0.5;
  }

  /**
   * Record auction result in the database
   */
  private async recordAuctionResult(adRequestId: string, winningAdId: string, winningBid: number, clearingPrice: number) {
    await prisma.adBid.create({
      data: {
        adRequestId,
        advertiserId: '', // Would be set based on winning ad's organization
        adId: winningAdId,
        bidAmount: winningBid,
        cpm: clearingPrice * 1000, // Convert to CPM
        won: true,
        createdAt: new Date()
      }
    });

    // Update ad request with served ad
    await prisma.adRequest.update({
      where: { id: adRequestId },
      data: {
        servedAdId: winningAdId,
        bidAmount: winningBid,
        cpm: clearingPrice * 1000,
        status: 'SERVED',
        updatedAt: new Date()
      }
    });
  }

  // Helper methods for targeting calculations
  private matchesGeoLocation(adGeo: any, requestGeo: any): boolean {
    if (adGeo.country && requestGeo.country && adGeo.country !== requestGeo.country) {
      return false;
    }
    if (adGeo.region && requestGeo.region && adGeo.region !== requestGeo.region) {
      return false;
    }
    return true;
  }

  private matchesDeviceInfo(adDevice: any, requestDevice: any): boolean {
    if (adDevice.type && requestDevice.type && adDevice.type !== requestDevice.type) {
      return false;
    }
    return true;
  }

  private calculateGeoScore(adGeo: any, requestGeo: any): number {
    if (adGeo.country === requestGeo.country) return 1;
    if (adGeo.region === requestGeo.region) return 0.8;
    return 0.3;
  }

  private calculateDeviceScore(adDevice: any, requestDevice: any): number {
    if (adDevice.type === requestDevice.type) return 1;
    return 0.5;
  }

  private calculateInterestScore(adInterests: string[], requestInterests: string[]): number {
    const intersection = adInterests.filter(interest => requestInterests.includes(interest));
    return intersection.length / Math.max(adInterests.length, requestInterests.length);
  }
} 