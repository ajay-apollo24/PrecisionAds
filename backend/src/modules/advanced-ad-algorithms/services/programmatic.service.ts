import { prisma } from '../../../shared/database/prisma';

export interface DealTerms {
  type: 'PREFERRED_DEAL' | 'PRIVATE_MARKETPLACE' | 'PROGRAMMATIC_GUARANTEED';
  floorPrice: number;
  targetCPM: number;
  volume: number;
  startDate: Date;
  endDate: Date;
  targeting: Record<string, any>;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface InventoryAvailability {
  adUnitId: string;
  availableImpressions: number;
  estimatedCPM: number;
  fillRate: number;
  targeting: Record<string, any>;
}

export interface DealPerformance {
  dealId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
}

export class ProgrammaticService {
  /**
   * Create a new programmatic deal
   */
  async createDeal(
    organizationId: string,
    dealData: {
      name: string;
      type: string;
      publisherId: string;
      campaignId?: string;
      dealTerms: DealTerms;
      targeting: Record<string, any>;
      budget?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<any> {
    try {
      // Validate deal data
      const validation = this.validateDealData(dealData);
      if (!validation.isValid) {
        throw new Error(`Invalid deal data: ${validation.errors.join(', ')}`);
      }

      // Check if publisher has available inventory
      const availableInventory = await this.checkInventoryAvailability(
        dealData.publisherId,
        dealData.targeting
      );

      if (availableInventory.length === 0) {
        throw new Error('No available inventory matching the targeting criteria');
      }

      // Calculate deal metrics
      const dealMetrics = this.calculateDealMetrics(dealData.dealTerms, availableInventory);

      // Create the deal
      const deal = await prisma.programmaticDeal.create({
        data: {
          organizationId,
          name: dealData.name,
          type: dealData.type,
          publisherId: dealData.publisherId,
          campaignId: dealData.campaignId,
          dealTerms: dealData.dealTerms,
          targeting: dealData.targeting,
          budget: dealData.budget,
          startDate: dealData.startDate,
          endDate: dealData.endDate,
          status: 'DRAFT',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create inventory records
      await this.createInventoryRecords(deal.id, availableInventory);

      return {
        deal,
        inventory: availableInventory,
        metrics: dealMetrics
      };
    } catch (error) {
      throw new Error(`Failed to create programmatic deal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a programmatic deal
   */
  async executeDeal(
    dealId: string,
    organizationId: string,
    adRequest: any
  ): Promise<{
    executed: boolean;
    adId?: string;
    price: number;
    dealId: string;
    reason?: string;
  }> {
    try {
      // Get the deal
      const deal = await prisma.programmaticDeal.findFirst({
        where: { id: dealId, organizationId }
      });

      if (!deal) {
        throw new Error('Deal not found');
      }

      if (deal.status !== 'ACTIVE') {
        return {
          executed: false,
          price: 0,
          dealId,
          reason: `Deal status is ${deal.status}`
        };
      }

      // Check if ad request matches deal targeting
      if (!this.matchesDealTargeting(adRequest, deal.targeting)) {
        return {
          executed: false,
          price: 0,
          dealId,
          reason: 'Ad request does not match deal targeting'
        };
      }

      // Check if deal has budget available
      if (deal.budget) {
        const spent = await this.getDealSpend(dealId);
        if (spent >= deal.budget) {
          return {
            executed: false,
            price: 0,
            dealId,
            reason: 'Deal budget exceeded'
          };
        }
      }

      // Check if deal is within date range
      if (deal.startDate && deal.endDate) {
        const now = new Date();
        if (now < deal.startDate || now > deal.endDate) {
          return {
            executed: false,
            price: 0,
            dealId,
            reason: 'Deal not within active date range'
          };
        }
      }

      // Get available ads for the deal
      const availableAds = await this.getAvailableAdsForDeal(dealId, adRequest);

      if (availableAds.length === 0) {
        return {
          executed: false,
          price: 0,
          dealId,
          reason: 'No available ads for this deal'
        };
      }

      // Select the best ad
      const selectedAd = this.selectBestAd(availableAds, deal.dealTerms);

      // Calculate price based on deal terms
      const price = this.calculateDealPrice(selectedAd, deal.dealTerms, adRequest);

      // Record the execution
      await this.recordDealExecution(dealId, selectedAd.id, price, adRequest);

      return {
        executed: true,
        adId: selectedAd.id,
        price,
        dealId
      };
    } catch (error) {
      throw new Error(`Failed to execute programmatic deal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get programmatic inventory availability
   */
  async getInventoryAvailability(
    publisherId: string,
    targeting: Record<string, any>,
    startDate: Date,
    endDate: Date
  ): Promise<InventoryAvailability[]> {
    try {
      // Get ad units for the publisher
      const adUnits = await prisma.adUnit.findMany({
        where: { 
          site: { organizationId: publisherId },
          status: 'ACTIVE'
        },
        include: {
          site: true,
          adRequests: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      });

      // Calculate availability for each ad unit
      const inventory = await Promise.all(
        adUnits.map(async (adUnit) => {
          const availability = await this.calculateAdUnitAvailability(
            adUnit,
            targeting,
            startDate,
            endDate
          );

          return {
            adUnitId: adUnit.id,
            availableImpressions: availability.availableImpressions,
            estimatedCPM: availability.estimatedCPM,
            fillRate: availability.fillRate,
            targeting: availability.targeting
          };
        })
      );

      // Filter by targeting criteria
      return inventory.filter(item => 
        this.matchesInventoryTargeting(item, targeting)
      );
    } catch (error) {
      throw new Error(`Failed to get inventory availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get deal performance analytics
   */
  async getDealPerformance(
    dealId: string,
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<DealPerformance> {
    try {
      const where: any = { dealId, organizationId };

      if (startDate && endDate) {
        where.date = {
          gte: startDate,
          lte: endDate
        };
      }

      const performance = await prisma.programmaticPerformance.findMany({
        where,
        orderBy: { date: 'desc' }
      });

      // Aggregate performance data
      const aggregated = performance.reduce((acc, perf) => ({
        impressions: acc.impressions + perf.impressions,
        clicks: acc.clicks + perf.clicks,
        conversions: acc.conversions + perf.conversions,
        spend: acc.spend + Number(perf.spend),
        revenue: acc.revenue + Number(perf.revenue)
      }), { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 });

      // Calculate derived metrics
      const ctr = aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions) * 100 : 0;
      const cpc = aggregated.clicks > 0 ? aggregated.spend / aggregated.clicks : 0;
      const cpm = aggregated.impressions > 0 ? (aggregated.spend / aggregated.impressions) * 1000 : 0;
      const roas = aggregated.spend > 0 ? aggregated.revenue / aggregated.spend : 0;

      return {
        dealId,
        ...aggregated,
        ctr,
        cpc,
        cpm,
        roas
      };
    } catch (error) {
      throw new Error(`Failed to get deal performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Optimize programmatic deals
   */
  async optimizeDeals(organizationId: string): Promise<{
    recommendations: Array<{
      dealId: string;
      type: string;
      description: string;
      impact: number;
      confidence: number;
    }>;
    estimatedImprovement: number;
  }> {
    try {
      // Get all deals for the organization
      const deals = await prisma.programmaticDeal.findMany({
        where: { organizationId },
        include: {
          performance: true
        }
      });

      const recommendations = [];

      for (const deal of deals) {
        // Analyze deal performance
        const performance = await this.getDealPerformance(deal.id, organizationId);
        
        // Generate optimization recommendations
        const dealRecommendations = this.generateDealRecommendations(deal, performance);
        recommendations.push(...dealRecommendations);
      }

      // Calculate estimated improvement
      const estimatedImprovement = recommendations.reduce((sum, rec) => sum + rec.impact, 0);

      return {
        recommendations,
        estimatedImprovement
      };
    } catch (error) {
      throw new Error(`Failed to optimize deals: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods
  private validateDealData(dealData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dealData.name || dealData.name.trim().length === 0) {
      errors.push('Deal name is required');
    }

    if (!dealData.type || !['PREFERRED_DEAL', 'PRIVATE_MARKETPLACE', 'PROGRAMMATIC_GUARANTEED'].includes(dealData.type)) {
      errors.push('Invalid deal type');
    }

    if (!dealData.publisherId) {
      errors.push('Publisher ID is required');
    }

    if (!dealData.dealTerms) {
      errors.push('Deal terms are required');
    }

    if (dealData.dealTerms.floorPrice <= 0) {
      errors.push('Floor price must be greater than 0');
    }

    if (dealData.dealTerms.volume <= 0) {
      errors.push('Volume must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async checkInventoryAvailability(
    publisherId: string,
    targeting: Record<string, any>
  ): Promise<any[]> {
    // Get available inventory for the publisher
    const adUnits = await prisma.adUnit.findMany({
      where: {
        site: { organizationId: publisherId },
        status: 'ACTIVE'
      },
      include: {
        site: true
      }
    });

    // Filter by targeting criteria
    return adUnits.filter(adUnit => 
      this.matchesInventoryTargeting(adUnit, targeting)
    );
  }

  private calculateDealMetrics(dealTerms: DealTerms, inventory: any[]): any {
    const totalImpressions = inventory.reduce((sum, item) => sum + item.availableImpressions, 0);
    const avgCPM = inventory.reduce((sum, item) => sum + item.estimatedCPM, 0) / inventory.length;
    
    return {
      totalImpressions,
      averageCPM: avgCPM,
      estimatedRevenue: (totalImpressions * avgCPM) / 1000,
      fillRate: Math.min(dealTerms.volume / totalImpressions, 1)
    };
  }

  private async createInventoryRecords(dealId: string, inventory: any[]): Promise<void> {
    for (const item of inventory) {
      await prisma.programmaticInventory.create({
        data: {
          organizationId: 'system', // Will be set based on deal
          publisherId: item.site.organizationId,
          adUnitType: item.format,
          geoLocation: item.site.geoLocation,
          date: new Date(),
          availableImpressions: item.availableImpressions,
          estimatedCPM: item.estimatedCPM,
          estimatedRevenue: (item.availableImpressions * item.estimatedCPM) / 1000,
          createdAt: new Date()
        }
      });
    }
  }

  private matchesDealTargeting(adRequest: any, dealTargeting: Record<string, any>): boolean {
    if (!dealTargeting) return true;

    // Check geographic targeting
    if (dealTargeting.geoLocation && adRequest.geoLocation) {
      if (!this.matchesGeographicTargeting(dealTargeting.geoLocation, adRequest.geoLocation)) {
        return false;
      }
    }

    // Check device targeting
    if (dealTargeting.deviceInfo && adRequest.deviceInfo) {
      if (!this.matchesDeviceTargeting(dealTargeting.deviceInfo, adRequest.deviceInfo)) {
        return false;
      }
    }

    // Check category targeting
    if (dealTargeting.categories && adRequest.categories) {
      if (!this.matchesCategoryTargeting(dealTargeting.categories, adRequest.categories)) {
        return false;
      }
    }

    return true;
  }

  private matchesGeographicTargeting(campaignGeo: any, requestGeo: any): boolean {
    if (campaignGeo.country && campaignGeo.country !== requestGeo.country) {
      return false;
    }

    if (campaignGeo.region && campaignGeo.region !== requestGeo.region) {
      return false;
    }

    return true;
  }

  private matchesDeviceTargeting(campaignDevice: any, requestDevice: any): boolean {
    if (campaignDevice.os && campaignDevice.os !== requestDevice.os) {
      return false;
    }

    if (campaignDevice.deviceType && campaignDevice.deviceType !== requestDevice.deviceType) {
      return false;
    }

    return true;
  }

  private matchesCategoryTargeting(campaignCategories: string[], requestCategories: string[]): boolean {
    if (!campaignCategories || !requestCategories) return true;

    return campaignCategories.some(cat => requestCategories.includes(cat));
  }

  private async getDealSpend(dealId: string): Promise<number> {
    const performance = await prisma.programmaticPerformance.findMany({
      where: { dealId }
    });

    return performance.reduce((sum, perf) => sum + Number(perf.spend), 0);
  }

  private async getAvailableAdsForDeal(dealId: string, adRequest: any): Promise<any[]> {
    // Get ads associated with the deal's campaign
    const deal = await prisma.programmaticDeal.findUnique({
      where: { id: dealId }
    });

    if (!deal?.campaignId) {
      return [];
    }

    return prisma.advertiserAd.findMany({
      where: {
        campaignId: deal.campaignId,
        status: 'ACTIVE'
      }
    });
  }

  private selectBestAd(ads: any[], dealTerms: DealTerms): any {
    if (ads.length === 0) return null;

    // Score ads based on deal terms and performance
    const scoredAds = ads.map(ad => {
      let score = 0;

      // Performance score
      if (ad.ctr > 0) score += ad.ctr * 100;
      if (ad.conversions > 0 && ad.clicks > 0) {
        score += (ad.conversions / ad.clicks) * 50;
      }

      // Deal priority score
      switch (dealTerms.priority) {
        case 'HIGH': score += 100; break;
        case 'MEDIUM': score += 50; break;
        case 'LOW': score += 25; break;
      }

      return { ...ad, score };
    });

    // Return highest scored ad
    scoredAds.sort((a, b) => b.score - a.score);
    return scoredAds[0];
  }

  private calculateDealPrice(ad: any, dealTerms: DealTerms, adRequest: any): number {
    let price = dealTerms.floorPrice;

    // Adjust based on ad performance
    if (ad.ctr > 0.03) price *= 1.1;
    if (ad.ctr < 0.01) price *= 0.9;

    // Adjust based on deal priority
    switch (dealTerms.priority) {
      case 'HIGH': price *= 1.2; break;
      case 'MEDIUM': price *= 1.0; break;
      case 'LOW': price *= 0.8; break;
    }

    // Ensure price is within reasonable bounds
    return Math.max(dealTerms.floorPrice, Math.min(price, dealTerms.targetCPM / 1000));
  }

  private async recordDealExecution(
    dealId: string,
    adId: string,
    price: number,
    adRequest: any
  ): Promise<void> {
    await prisma.programmaticPerformance.create({
      data: {
        organizationId: 'system', // Will be set based on deal
        dealId,
        publisherId: null,
        date: new Date(),
        impressions: 1,
        clicks: 0,
        conversions: 0,
        spend: price,
        revenue: 0,
        type: 'PROGRAMMATIC',
        createdAt: new Date()
      }
    });
  }

  private async calculateAdUnitAvailability(
    adUnit: any,
    targeting: Record<string, any>,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    // Calculate available impressions
    const totalRequests = adUnit.adRequests.length;
    const availableImpressions = Math.floor(totalRequests * 0.8); // Assume 80% fill rate

    // Estimate CPM based on historical data
    const estimatedCPM = 2.50; // Default CPM

    // Calculate fill rate
    const fillRate = availableImpressions / totalRequests;

    return {
      availableImpressions,
      estimatedCPM,
      fillRate,
      targeting: adUnit.targeting || {}
    };
  }

  private matchesInventoryTargeting(inventory: any, targeting: Record<string, any>): boolean {
    if (!targeting) return true;

    // Check format compatibility
    if (targeting.formats && !targeting.formats.includes(inventory.format)) {
      return false;
    }

    // Check size compatibility
    if (targeting.sizes && !targeting.sizes.some((size: any) => 
      size.w === inventory.size?.w && size.h === inventory.size?.h
    )) {
      return false;
    }

    return true;
  }

  private generateDealRecommendations(deal: any, performance: DealPerformance): any[] {
    const recommendations = [];

    // Performance-based recommendations
    if (performance.ctr < 1.0) {
      recommendations.push({
        dealId: deal.id,
        type: 'PERFORMANCE',
        description: 'Low CTR detected. Consider creative optimization or targeting refinement.',
        impact: 0.15,
        confidence: 0.8
      });
    }

    if (performance.cpm > 5.0) {
      recommendations.push({
        dealId: deal.id,
        type: 'COST',
        description: 'High CPM detected. Consider adjusting floor price or targeting.',
        impact: 0.20,
        confidence: 0.85
      });
    }

    if (performance.roas < 2.0) {
      recommendations.push({
        dealId: deal.id,
        type: 'ROI',
        description: 'Low ROAS detected. Consider audience optimization or bid strategy adjustment.',
        impact: 0.25,
        confidence: 0.9
      });
    }

    return recommendations;
  }
} 