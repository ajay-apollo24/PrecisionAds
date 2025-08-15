import { prisma } from '../../../shared/database/prisma';

export class BiddingService {
  /**
   * Calculate optimal bid based on campaign strategy and performance
   */
  async calculateOptimalBid(
    campaignId: string,
    organizationId: string,
    adUnitId: string,
    targetingScore: number = 0.5
  ): Promise<{
    bidAmount: number;
    confidence: number;
    factors: Record<string, any>;
  }> {
    // Get campaign details
    const campaign = await prisma.advertiserCampaign.findFirst({
      where: { id: campaignId, organizationId },
      select: {
        bidStrategy: true,
        targetCPM: true,
        targetCPC: true,
        targetCPA: true,
        budget: true,
        totalSpent: true
      }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get ad unit information
    const adUnit = await prisma.adUnit.findFirst({
      where: { id: adUnitId },
      select: { format: true, size: true }
    });

    if (!adUnit) {
      throw new Error('Ad unit not found');
    }

    // Get historical performance data
    const historicalData = await this.getHistoricalPerformance(campaignId, organizationId);

    // Calculate base bid based on strategy
    let baseBid = this.calculateBaseBid(campaign, adUnit);
    
    // Apply performance adjustments
    let performanceMultiplier = this.calculatePerformanceMultiplier(historicalData);
    
    // Apply targeting adjustments
    let targetingMultiplier = this.calculateTargetingMultiplier(targetingScore);
    
    // Apply budget constraints
    let budgetMultiplier = this.calculateBudgetMultiplier(campaign);

    // Calculate final bid
    const finalBid = baseBid * performanceMultiplier * targetingMultiplier * budgetMultiplier;
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(historicalData, targetingScore);

    return {
      bidAmount: Math.max(0.01, Math.min(finalBid, campaign.budget * 0.1)), // Cap at 10% of budget
      confidence,
      factors: {
        baseBid,
        performanceMultiplier,
        targetingMultiplier,
        budgetMultiplier,
        historicalData: historicalData.summary,
        adUnit: {
          format: adUnit.format,
          size: adUnit.size
        }
      }
    };
  }

  /**
   * Get historical performance data for the campaign
   */
  private async getHistoricalPerformance(campaignId: string, organizationId: string) {
    const ads = await prisma.advertiserAd.findMany({
      where: { campaignId, organizationId },
      select: {
        impressions: true,
        clicks: true,
        conversions: true,
        ctr: true,
        cpc: true,
        cpm: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 30 // Last 30 ads
    });

    if (ads.length === 0) {
      return {
        summary: {
          avgCTR: 0.02, // Default 2% CTR
          avgCPC: 1.50, // Default $1.50 CPC
          avgCPM: 3.00, // Default $3.00 CPM
          conversionRate: 0.01, // Default 1% conversion rate
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0
        },
        recent: []
      };
    }

    const totalImpressions = ads.reduce((sum: number, ad: any) => sum + ad.impressions, 0);
    const totalClicks = ads.reduce((sum: number, ad: any) => sum + ad.clicks, 0);
    const totalConversions = ads.reduce((sum: number, ad: any) => sum + ad.conversions, 0);
    const totalCPC = ads.reduce((sum: number, ad: any) => sum + Number(ad.cpc), 0);
    const totalCPM = ads.reduce((sum: number, ad: any) => sum + Number(ad.cpm), 0);

    return {
      summary: {
        avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) : 0,
        avgCPC: totalClicks > 0 ? totalCPC / totalClicks : 0,
        avgCPM: totalImpressions > 0 ? totalCPM / ads.length : 0,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) : 0,
        totalImpressions,
        totalClicks,
        totalConversions
      },
      recent: ads.slice(0, 10)
    };
  }

  /**
   * Calculate base bid based on campaign strategy
   */
  private calculateBaseBid(campaign: any, adUnit: any): number {
    let baseBid = 0;

    switch (campaign.bidStrategy) {
      case 'MANUAL':
        baseBid = campaign.targetCPM ? campaign.targetCPM / 1000 : 0.01;
        break;
      case 'AUTO_CPC':
        baseBid = campaign.targetCPC ? Number(campaign.targetCPC) : 1.50;
        break;
      case 'AUTO_CPM':
        baseBid = campaign.targetCPM ? campaign.targetCPM / 1000 : 0.003;
        break;
      case 'TARGET_CPA':
        baseBid = campaign.targetCPA ? Number(campaign.targetCPA) * 0.1 : 0.50;
        break;
      case 'PREDICTIVE':
        baseBid = campaign.targetCPM ? campaign.targetCPM / 1000 * 1.2 : 0.01;
        break;
      case 'AI_OPTIMIZED':
        baseBid = campaign.targetCPM ? campaign.targetCPM / 1000 * 1.5 : 0.01;
        break;
      default:
        baseBid = 0.01;
    }

    // Adjust based on ad unit format
    const formatMultiplier = this.getFormatMultiplier(adUnit.format);
    baseBid *= formatMultiplier;

    return baseBid;
  }

  /**
   * Calculate performance multiplier based on historical data
   */
  private calculatePerformanceMultiplier(historicalData: any): number {
    const { avgCTR, avgCPC, avgCPM, conversionRate } = historicalData.summary;
    
    // Base multiplier
    let multiplier = 1.0;
    
    // CTR adjustment (industry average is ~2%)
    if (avgCTR > 0.03) multiplier *= 1.2; // High CTR
    else if (avgCTR < 0.01) multiplier *= 0.8; // Low CTR
    
    // Conversion rate adjustment (industry average is ~1%)
    if (conversionRate > 0.02) multiplier *= 1.3; // High conversion
    else if (conversionRate < 0.005) multiplier *= 0.7; // Low conversion
    
    // CPC adjustment
    if (avgCPC < 1.00) multiplier *= 1.1; // Low CPC
    else if (avgCPC > 3.00) multiplier *= 0.9; // High CPC
    
    return Math.max(0.5, Math.min(2.0, multiplier));
  }

  /**
   * Calculate targeting multiplier based on targeting score
   */
  private calculateTargetingMultiplier(targetingScore: number): number {
    if (targetingScore >= 0.9) return 1.3; // Excellent targeting
    if (targetingScore >= 0.7) return 1.1; // Good targeting
    if (targetingScore >= 0.5) return 1.0; // Average targeting
    if (targetingScore >= 0.3) return 0.9; // Poor targeting
    return 0.7; // Very poor targeting
  }

  /**
   * Calculate budget multiplier based on budget constraints
   */
  private calculateBudgetMultiplier(campaign: any): number {
    const budget = Number(campaign.budget);
    const spent = Number(campaign.totalSpent);
    const remainingBudget = budget - spent;
    const budgetUtilization = spent / budget;

    if (budgetUtilization > 0.9) return 0.8; // Near budget limit
    if (budgetUtilization > 0.7) return 0.9; // High budget utilization
    if (budgetUtilization < 0.3) return 1.2; // Low budget utilization
    return 1.0; // Normal budget utilization
  }

  /**
   * Calculate confidence score for the bid
   */
  private calculateConfidence(historicalData: any, targetingScore: number): number {
    let confidence = 0.5; // Base confidence
    
    // Data volume confidence
    if (historicalData.summary.totalImpressions > 10000) confidence += 0.2;
    else if (historicalData.summary.totalImpressions > 1000) confidence += 0.1;
    
    // Performance stability confidence
    const ctr = historicalData.summary.avgCTR;
    if (ctr > 0.01 && ctr < 0.05) confidence += 0.1; // Stable CTR range
    
    // Targeting confidence
    confidence += targetingScore * 0.2;
    
    return Math.min(1.0, confidence);
  }

  /**
   * Get format multiplier for different ad unit formats
   */
  private getFormatMultiplier(format: string): number {
    switch (format) {
      case 'VIDEO': return 1.5; // Video ads typically cost more
      case 'NATIVE': return 1.3; // Native ads have higher engagement
      case 'INTERSTITIAL': return 1.2; // Interstitial ads are premium
      case 'BANNER': return 1.0; // Standard banner ads
      case 'DISPLAY': return 1.0; // Standard display ads
      default: return 1.0;
    }
  }

  /**
   * Simulate real-time bidding auction
   */
  async simulateRTBAuction(
    campaignId: string,
    organizationId: string,
    adUnitId: string,
    competitors: number = 5
  ): Promise<{
    won: boolean;
    bidAmount: number;
    clearingPrice: number;
    position: number;
    competitors: number;
  }> {
    const optimalBid = await this.calculateOptimalBid(campaignId, organizationId, adUnitId);
    
    // Generate competitor bids (simplified simulation)
    const competitorBids = Array.from({ length: competitors }, () => 
      Math.random() * 10 + 0.01 // Random bids between $0.01 and $10.01
    );
    
    // Add our bid to the mix
    const allBids = [...competitorBids, optimalBid.bidAmount].sort((a, b) => b - a);
    
    // Find our position
    const ourPosition = allBids.indexOf(optimalBid.bidAmount) + 1;
    
    // Determine if we won (assuming top 3 positions win)
    const won = ourPosition <= 3;
    
    // Calculate clearing price (second-highest bid in Vickrey auction)
    const clearingPrice = allBids.length > 1 ? allBids[1] : allBids[0];
    
    return {
      won,
      bidAmount: optimalBid.bidAmount,
      clearingPrice,
      position: ourPosition,
      competitors: competitors
    };
  }
} 