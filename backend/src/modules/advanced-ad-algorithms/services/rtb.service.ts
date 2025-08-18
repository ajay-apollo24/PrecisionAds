import { prisma } from '../../../shared/database/prisma';
import { CampaignStatus } from '@prisma/client';

export interface BidRequest {
  id: string;
  imp: Array<{
    id: string;
    banner?: {
      w: number;
      h: number;
      format?: Array<{ w: number; h: number }>;
    };
    video?: {
      w: number;
      h: number;
      mimes?: string[];
    };
    native?: {
      request: string;
    };
    tagid: string;
    bidfloor: number;
    bidfloorcur: string;
  }>;
  app?: {
    id: string;
    name: string;
    bundle: string;
    ver: string;
  };
  site?: {
    id: string;
    name: string;
    domain: string;
    page: string;
  };
  device?: {
    ua: string;
    ip: string;
    geo?: {
      country: string;
      region: string;
      city: string;
      lat: number;
      lon: number;
    };
    make: string;
    model: string;
    os: string;
    osv: string;
    language: string;
    carrier: string;
    connectiontype: number;
    devicetype: number;
  };
  user?: {
    id: string;
    buyeruid: string;
    yob: number;
    gender: string;
    keywords: string;
    customdata: string;
    geo?: {
      country: string;
      region: string;
      city: string;
      lat: number;
      lon: number;
    };
  };
  at: number;
  tmax: number;
  wseat: string[];
  bseat: string[];
  allimps: number;
  cur: string[];
  wlang: string[];
  bcat: string[];
  badv: string[];
  bapp: string[];
  source?: {
    fd: number;
    tid: string;
    ts: number;
    ds: string;
    dsmap: string[];
  };
  regs?: {
    coppa: number;
    ext: any;
  };
}

export interface BidResponse {
  id: string;
  seatbid: Array<{
    bid: Array<{
      id: string;
      impid: string;
      price: number;
      adid: string;
      nurl: string;
      adm: string;
      adomain: string[];
      bundle: string;
      iurl: string;
      cid: string;
      crid: string;
      tactic: string;
      cat: string[];
      attr: number[];
      api: number;
      protocol: number;
      qagmediarating: number;
      language: string;
      dealid: string;
      w: number;
      h: number;
      wratio: number;
      hratio: number;
      exp: number;
      ext: any;
    }>;
    seat: string;
    group: number;
    ext: any;
  }>;
  bidid: string;
  cur: string;
  customdata: string;
  nbr: number;
  ext: any;
}

export interface ExchangeConfig {
  id: string;
  name: string;
  endpoint: string;
  timeout: number;
  rateLimit: number;
  authentication: {
    type: string;
    credentials: Record<string, string>;
  };
  bidFloor: number;
  currency: string;
}

export class RTBService {
  private exchanges: Map<string, ExchangeConfig> = new Map();

  constructor() {
    this.initializeExchanges();
  }

  /**
   * Process incoming bid request from exchange
   */
  async processBidRequest(bidRequest: BidRequest, exchangeId: string): Promise<BidResponse | null> {
    try {
      // Validate bid request
      if (!this.validateBidRequest(bidRequest)) {
        console.warn('Invalid bid request received:', bidRequest.id);
        return null;
      }

      // Get active RTB campaigns
      const activeCampaigns = await this.getActiveRTBCampaigns(exchangeId);

      if (activeCampaigns.length === 0) {
        return null;
      }

      // Find eligible campaigns for this bid request
      const eligibleCampaigns = this.findEligibleCampaigns(bidRequest, activeCampaigns);

      if (eligibleCampaigns.length === 0) {
        return null;
      }

      // Generate bids for eligible campaigns
      const bids = await this.generateBids(bidRequest, eligibleCampaigns);

      if (bids.length === 0) {
        return null;
      }

      // Select winning bid
      const winningBid = this.selectWinningBid(bids, bidRequest);

      if (!winningBid) {
        return null;
      }

      // Create bid response
      const bidResponse = this.createBidResponse(bidRequest, winningBid);

      // Record bid request and response
      await this.recordBidRequest(bidRequest, exchangeId, 'PROCESSED');
      await this.recordBidResponse(bidResponse, winningBid);

      return bidResponse;
    } catch (error) {
      console.error('Error processing bid request:', error);
      await this.recordBidRequest(bidRequest, exchangeId, 'ERROR');
      return null;
    }
  }

  /**
   * Validate bid request format
   */
  private validateBidRequest(bidRequest: BidRequest): boolean {
    if (!bidRequest.id || !bidRequest.imp || bidRequest.imp.length === 0) {
      return false;
    }

    for (const imp of bidRequest.imp) {
      if (!imp.id || !imp.tagid || imp.bidfloor === undefined) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get active RTB campaigns for an exchange
   */
  private async getActiveRTBCampaigns(exchangeId: string): Promise<any[]> {
    return prisma.rTBCampaign.findMany({
      where: {
        status: 'ACTIVE',
        exchanges: {
          path: ['$'],
          array_contains: exchangeId
        }
      },
      include: {
        targeting: true,
        budget: true
      }
    });
  }

  /**
   * Find campaigns eligible for the bid request
   */
  private findEligibleCampaigns(bidRequest: BidRequest, campaigns: any[]): any[] {
    return campaigns.filter(campaign => {
      // Check budget availability
      if (campaign.budget && campaign.totalSpent >= campaign.budget) {
        return false;
      }

      // Check targeting criteria
      if (!this.matchesTargeting(bidRequest, campaign.targeting)) {
        return false;
      }

      // Check ad unit compatibility
      if (!this.matchesAdUnit(bidRequest.imp[0], campaign)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Check if bid request matches campaign targeting
   */
  private matchesTargeting(bidRequest: BidRequest, targeting: any): boolean {
    if (!targeting) return true;

    // Geographic targeting
    if (targeting.geoLocation && bidRequest.device?.geo) {
      if (!this.matchesGeographicTargeting(targeting.geoLocation, bidRequest.device.geo)) {
        return false;
      }
    }

    // Device targeting
    if (targeting.deviceInfo && bidRequest.device) {
      if (!this.matchesDeviceTargeting(targeting.deviceInfo, bidRequest.device)) {
        return false;
      }
    }

    // Category targeting
    if (targeting.categories && bidRequest.bcat) {
      if (!this.matchesCategoryTargeting(targeting.categories, bidRequest.bcat)) {
        return false;
      }
    }

    // User targeting
    if (targeting.userAttributes && bidRequest.user) {
      if (!this.matchesUserTargeting(targeting.userAttributes, bidRequest.user)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check geographic targeting match
   */
  private matchesGeographicTargeting(campaignGeo: any, requestGeo: any): boolean {
    if (campaignGeo.country && campaignGeo.country !== requestGeo.country) {
      return false;
    }

    if (campaignGeo.region && campaignGeo.region !== requestGeo.region) {
      return false;
    }

    if (campaignGeo.city && campaignGeo.city !== requestGeo.city) {
      return false;
    }

    // Check radius-based targeting
    if (campaignGeo.lat && campaignGeo.lon && campaignGeo.radius) {
      const distance = this.calculateDistance(
        campaignGeo.lat, campaignGeo.lon,
        requestGeo.lat, requestGeo.lon
      );
      if (distance > campaignGeo.radius) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check device targeting match
   */
  private matchesDeviceTargeting(campaignDevice: any, requestDevice: any): boolean {
    if (campaignDevice.os && campaignDevice.os !== requestDevice.os) {
      return false;
    }

    if (campaignDevice.deviceType && campaignDevice.deviceType !== requestDevice.devicetype) {
      return false;
    }

    if (campaignDevice.carrier && campaignDevice.carrier !== requestDevice.carrier) {
      return false;
    }

    return true;
  }

  /**
   * Check category targeting match
   */
  private matchesCategoryTargeting(campaignCategories: string[], requestCategories: string[]): boolean {
    if (!campaignCategories || !requestCategories) return true;

    return campaignCategories.some(cat => requestCategories.includes(cat));
  }

  /**
   * Check user targeting match
   */
  private matchesUserTargeting(campaignUser: any, requestUser: any): boolean {
    if (campaignUser.ageRange && requestUser.yob) {
      const age = new Date().getFullYear() - requestUser.yob;
      if (age < campaignUser.ageRange.min || age > campaignUser.ageRange.max) {
        return false;
      }
    }

    if (campaignUser.gender && campaignUser.gender !== requestUser.gender) {
      return false;
    }

    return true;
  }

  /**
   * Check ad unit compatibility
   */
  private matchesAdUnit(imp: any, campaign: any): boolean {
    const campaignFormats = campaign.targeting?.formats || [];
    
    if (campaignFormats.length === 0) return true;

    if (imp.banner) {
      return campaignFormats.includes('BANNER') && 
             this.matchesBannerFormat(imp.banner, campaign);
    }

    if (imp.video) {
      return campaignFormats.includes('VIDEO') && 
             this.matchesVideoFormat(imp.video, campaign);
    }

    if (imp.native) {
      return campaignFormats.includes('NATIVE');
    }

    return false;
  }

  /**
   * Check banner format compatibility
   */
  private matchesBannerFormat(banner: any, campaign: any): boolean {
    const campaignSizes = campaign.targeting?.sizes || [];
    
    if (campaignSizes.length === 0) return true;

    return campaignSizes.some((size: any) => 
      size.w === banner.w && size.h === banner.h
    );
  }

  /**
   * Check video format compatibility
   */
  private matchesVideoFormat(video: any, campaign: any): boolean {
    const campaignSizes = campaign.targeting?.sizes || [];
    
    if (campaignSizes.length === 0) return true;

    return campaignSizes.some((size: any) => 
      size.w === video.w && size.h === video.h
    );
  }

  /**
   * Generate bids for eligible campaigns
   */
  private async generateBids(bidRequest: BidRequest, campaigns: any[]): Promise<any[]> {
    const bids = [];

    for (const campaign of campaigns) {
      try {
        const bid = await this.calculateBid(bidRequest, campaign);
        if (bid && bid.price >= bidRequest.imp[0].bidfloor) {
          bids.push(bid);
        }
      } catch (error) {
        console.error(`Error calculating bid for campaign ${campaign.id}:`, error);
        continue;
      }
    }

    return bids;
  }

  /**
   * Calculate bid for a campaign
   */
  private async calculateBid(bidRequest: BidRequest, campaign: any): Promise<any> {
    // Get campaign performance data
    const performance = await this.getCampaignPerformance(campaign.id);
    
    // Calculate base bid based on campaign strategy
    let baseBid = this.calculateBaseBid(campaign, bidRequest);
    
    // Apply performance multiplier
    const performanceMultiplier = this.calculatePerformanceMultiplier(performance);
    
    // Apply targeting multiplier
    const targetingMultiplier = this.calculateTargetingMultiplier(bidRequest, campaign);
    
    // Apply budget multiplier
    const budgetMultiplier = this.calculateBudgetMultiplier(campaign);
    
    // Calculate final bid
    const finalBid = baseBid * performanceMultiplier * targetingMultiplier * budgetMultiplier;
    
    // Ensure bid is within campaign limits
    const maxBid = Math.min(campaign.maxBid, campaign.budget - campaign.totalSpent);
    const finalBidCapped = Math.min(finalBid, maxBid);
    
    return {
      campaignId: campaign.id,
      price: finalBidCapped,
      adId: campaign.adId,
      creative: campaign.creative,
      targetingScore: targetingMultiplier,
      performanceScore: performanceMultiplier
    };
  }

  /**
   * Calculate base bid based on campaign strategy
   */
  private calculateBaseBid(campaign: any, bidRequest: BidRequest): number {
    const floorPrice = bidRequest.imp[0].bidfloor;
    
    switch (campaign.bidStrategy) {
      case 'MANUAL':
        return Math.max(floorPrice, campaign.maxBid);
      case 'AUTO_CPC':
        return Math.max(floorPrice, campaign.targetCPC || floorPrice);
      case 'AUTO_CPM':
        return Math.max(floorPrice, (campaign.targetCPM || 0) / 1000);
      case 'TARGET_CPA':
        return Math.max(floorPrice, (campaign.targetCPA || 0) * 0.1);
      case 'PREDICTIVE':
        return Math.max(floorPrice, floorPrice * 1.2);
      case 'AI_OPTIMIZED':
        return Math.max(floorPrice, floorPrice * 1.5);
      default:
        return floorPrice;
    }
  }

  /**
   * Calculate performance multiplier
   */
  private calculatePerformanceMultiplier(performance: any): number {
    if (!performance) return 1.0;
    
    let multiplier = 1.0;
    
    // CTR-based adjustment
    if (performance.ctr > 0.03) multiplier *= 1.2;
    else if (performance.ctr < 0.01) multiplier *= 0.8;
    
    // Conversion rate adjustment
    if (performance.conversionRate > 0.02) multiplier *= 1.3;
    else if (performance.conversionRate < 0.005) multiplier *= 0.7;
    
    return Math.max(0.5, Math.min(2.0, multiplier));
  }

  /**
   * Calculate targeting multiplier
   */
  private calculateTargetingMultiplier(bidRequest: BidRequest, campaign: any): number {
    let multiplier = 1.0;
    
    // Geographic targeting bonus
    if (campaign.targeting?.geoLocation) {
      multiplier *= 1.1;
    }
    
    // Device targeting bonus
    if (campaign.targeting?.deviceInfo) {
      multiplier *= 1.05;
    }
    
    // Category targeting bonus
    if (campaign.targeting?.categories) {
      multiplier *= 1.15;
    }
    
    return multiplier;
  }

  /**
   * Calculate budget multiplier
   */
  private calculateBudgetMultiplier(campaign: any): number {
    const budget = Number(campaign.budget);
    const spent = Number(campaign.totalSpent);
    const utilization = spent / budget;
    
    if (utilization > 0.9) return 0.8;
    if (utilization > 0.7) return 0.9;
    if (utilization < 0.3) return 1.2;
    
    return 1.0;
  }

  /**
   * Select winning bid
   */
  private selectWinningBid(bids: any[], bidRequest: BidRequest): any {
    if (bids.length === 0) return null;
    
    // Sort bids by effective CPM (price * 1000 / impression value)
    const bidsWithECPM = bids.map(bid => ({
      ...bid,
      ecpm: bid.price * 1000
    }));
    
    bidsWithECPM.sort((a, b) => b.ecpm - a.ecpm);
    
    // Return highest bid
    return bidsWithECPM[0];
  }

  /**
   * Create bid response
   */
  private createBidResponse(bidRequest: BidRequest, winningBid: any): BidResponse {
    return {
      id: bidRequest.id,
      bidid: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cur: 'USD',
      customdata: '',
      nbr: 0,
      ext: {},
      seatbid: [{
        bid: [{
          id: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          impid: bidRequest.imp[0].id,
          price: winningBid.price,
          adid: winningBid.adId,
          nurl: '',
          adm: winningBid.creative,
          adomain: ['example.com'],
          bundle: '',
          iurl: '',
          cid: winningBid.campaignId,
          crid: winningBid.adId,
          tactic: '',
          cat: [],
          attr: [],
          api: 0,
          protocol: 0,
          qagmediarating: 0,
          language: 'en',
          dealid: '',
          w: bidRequest.imp[0].banner?.w || 0,
          h: bidRequest.imp[0].banner?.h || 0,
          wratio: 0,
          hratio: 0,
          exp: 0,
          ext: {}
        }],
        seat: 'seat_1',
        group: 0,
        ext: {}
      }]
    };
  }

  /**
   * Get campaign performance data
   */
  async getCampaignPerformance(campaignId: string): Promise<any> {
    const performance = await prisma.rTBPerformance.findFirst({
      where: { campaignId },
      orderBy: { date: 'desc' }
    });
    
    return performance;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Record bid request
   */
  private async recordBidRequest(bidRequest: BidRequest, exchangeId: string, status: string): Promise<void> {
    await prisma.rTBBidRequest.create({
      data: {
        organizationId: 'system', // Will be set based on exchange
        campaignId: null,
        exchange: exchangeId,
        requestData: bidRequest,
        status,
        createdAt: new Date()
      }
    });
  }

  /**
   * Record bid response
   */
  private async recordBidResponse(bidResponse: BidResponse, winningBid: any): Promise<void> {
          // Update bid request status
      await prisma.rTBBidRequest.updateMany({
        where: { 
          exchange: 'system', // Will be set based on exchange
          status: 'PROCESSED'
        },
        data: { status: 'RESPONDED' }
      });
  }

  /**
   * Initialize exchange configurations
   */
  private initializeExchanges(): void {
    // Add default exchanges
    this.exchanges.set('default', {
      id: 'default',
      name: 'Default Exchange',
      endpoint: 'https://exchange.example.com/rtb',
      timeout: 100,
      rateLimit: 1000,
      authentication: {
        type: 'bearer',
        credentials: { token: 'default_token' }
      },
      bidFloor: 0.01,
      currency: 'USD'
    });
  }

  /**
   * Get exchange configuration
   */
  getExchangeConfig(exchangeId: string): ExchangeConfig | undefined {
    return this.exchanges.get(exchangeId);
  }

  /**
   * Add new exchange
   */
  addExchange(config: ExchangeConfig): void {
    this.exchanges.set(config.id, config);
  }

  /**
   * Remove exchange
   */
  removeExchange(exchangeId: string): boolean {
    return this.exchanges.delete(exchangeId);
  }

  /**
   * Get all exchange configurations
   */
  getExchangeConfigs(): Map<string, ExchangeConfig> {
    return this.exchanges;
  }
} 