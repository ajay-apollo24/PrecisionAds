import { prisma } from '../../../shared/database/prisma';

export interface RetargetingRule {
  type: 'PAGE_VIEW' | 'CART_ABANDONMENT' | 'PRODUCT_VIEW' | 'SEARCH_QUERY' | 'CUSTOM_EVENT';
  conditions: Record<string, any>;
  frequency: {
    maxImpressions: number;
    timeWindow: 'hour' | 'day' | 'week' | 'month';
  };
  priority: number;
  bidMultiplier: number;
}

export interface UserSegment {
  userId: string;
  segmentId: string;
  score: number;
  lastActivity: Date;
  engagementLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  interests: string[];
  behaviors: string[];
}

export interface RetargetingCampaign {
  id: string;
  name: string;
  description?: string;
  targetAudience: {
    segments: string[];
    lookalikeAudience?: string;
    customRules: RetargetingRule[];
  };
  retargetingRules: RetargetingRule[];
  frequencyCaps: {
    maxImpressions: number;
    timeWindow: string;
    userLevel: boolean;
    campaignLevel: boolean;
  };
  bidStrategy: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  status: string;
}

export class RetargetingService {
  /**
   * Create a retargeting campaign
   */
  async createRetargetingCampaign(
    organizationId: string,
    campaignData: {
      name: string;
      description?: string;
      targetAudience: any;
      retargetingRules: RetargetingRule[];
      frequencyCaps: any;
      bidStrategy: string;
      budget: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<any> {
    try {
      // Validate campaign data
      const validation = this.validateRetargetingCampaign(campaignData);
      if (!validation.isValid) {
        throw new Error(`Invalid campaign data: ${validation.errors.join(', ')}`);
      }

      // Create the campaign
      const campaign = await prisma.retargetingCampaign.create({
        data: {
          organizationId,
          name: campaignData.name,
          description: campaignData.description,
          targetAudience: campaignData.targetAudience,
          retargetingRules: campaignData.retargetingRules,
          frequencyCaps: campaignData.frequencyCaps,
          bidStrategy: campaignData.bidStrategy,
          budget: campaignData.budget,
          startDate: campaignData.startDate,
          endDate: campaignData.endDate,
          status: 'DRAFT',
          type: 'RETARGETING',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Build initial audience segments
      await this.buildAudienceSegments(campaign.id, campaignData.targetAudience);

      return campaign;
    } catch (error) {
      throw new Error(`Failed to create retargeting campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process user event for retargeting
   */
  async processUserEvent(
    organizationId: string,
    userId: string,
    event: {
      type: string;
      data: Record<string, any>;
      timestamp: Date;
      pageUrl?: string;
      productId?: string;
      category?: string;
      searchQuery?: string;
    }
  ): Promise<{
    eligibleCampaigns: any[];
    recommendations: any[];
    nextActions: string[];
  }> {
    try {
      // Get active retargeting campaigns
      const activeCampaigns = await this.getActiveRetargetingCampaigns(organizationId);

      if (activeCampaigns.length === 0) {
        return { eligibleCampaigns: [], recommendations: [], nextActions: [] };
      }

      // Update user profile based on event
      await this.updateUserProfile(userId, event);

      // Find eligible campaigns for this user
      const eligibleCampaigns = await this.findEligibleCampaigns(userId, event, activeCampaigns);

      // Generate recommendations
      const recommendations = this.generateRetargetingRecommendations(userId, event, eligibleCampaigns);

      // Determine next actions
      const nextActions = this.determineNextActions(userId, event, eligibleCampaigns);

      return {
        eligibleCampaigns,
        recommendations,
        nextActions
      };
    } catch (error) {
      throw new Error(`Failed to process user event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build audience segments for retargeting
   */
  async buildAudienceSegments(
    campaignId: string,
    targetAudience: any
  ): Promise<void> {
    try {
      const { segments, lookalikeAudience, customRules } = targetAudience;

      // Process predefined segments
      if (segments && segments.length > 0) {
        for (const segmentId of segments) {
          await this.processPredefinedSegment(campaignId, segmentId);
        }
      }

      // Process lookalike audience
      if (lookalikeAudience) {
        await this.buildLookalikeAudience(campaignId, lookalikeAudience);
      }

      // Process custom rules
      if (customRules && customRules.length > 0) {
        await this.processCustomRules(campaignId, customRules);
      }
    } catch (error) {
      throw new Error(`Failed to build audience segments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get retargeting recommendations for a user
   */
  async getRetargetingRecommendations(
    userId: string,
    organizationId: string,
    context: any = {}
  ): Promise<{
    campaigns: any[];
    ads: any[];
    bidRecommendations: any[];
    frequencyStatus: any;
  }> {
    try {
      // Get user's retargeting profile
      const userProfile = await this.getUserRetargetingProfile(userId, organizationId);

      if (!userProfile) {
        return { campaigns: [], ads: [], bidRecommendations: [], frequencyStatus: {} };
      }

      // Get eligible campaigns
      const eligibleCampaigns = await this.getEligibleRetargetingCampaigns(userId, organizationId);

      // Get recommended ads
      const recommendedAds = await this.getRecommendedAds(userId, eligibleCampaigns, context);

      // Get bid recommendations
      const bidRecommendations = await this.getBidRecommendations(userId, eligibleCampaigns, context);

      // Get frequency status
      const frequencyStatus = await this.getFrequencyStatus(userId, eligibleCampaigns);

      return {
        campaigns: eligibleCampaigns,
        ads: recommendedAds,
        bidRecommendations,
        frequencyStatus
      };
    } catch (error) {
      throw new Error(`Failed to get retargeting recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update retargeting campaign performance
   */
  async updateCampaignPerformance(
    campaignId: string,
    organizationId: string,
    performanceData: {
      impressions: number;
      clicks: number;
      conversions: number;
      spend: number;
      revenue: number;
    }
  ): Promise<void> {
    try {
      // Update campaign performance
      await prisma.retargetingCampaign.update({
        where: { id: campaignId, organizationId },
        data: {
          impressions: { increment: performanceData.impressions },
          clicks: { increment: performanceData.clicks },
          conversions: { increment: performanceData.conversions },
          totalSpent: { increment: performanceData.spend },
          totalRevenue: { increment: performanceData.revenue },
          updatedAt: new Date()
        }
      });

      // Update audience segment performance
      await this.updateAudienceSegmentPerformance(campaignId, performanceData);

      // Trigger optimization if needed
      await this.triggerOptimization(campaignId, performanceData);
    } catch (error) {
      throw new Error(`Failed to update campaign performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods
  private validateRetargetingCampaign(campaignData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!campaignData.name || campaignData.name.trim().length === 0) {
      errors.push('Campaign name is required');
    }

    if (!campaignData.targetAudience) {
      errors.push('Target audience is required');
    }

    if (!campaignData.retargetingRules || campaignData.retargetingRules.length === 0) {
      errors.push('At least one retargeting rule is required');
    }

    if (!campaignData.frequencyCaps) {
      errors.push('Frequency caps are required');
    }

    if (campaignData.budget <= 0) {
      errors.push('Budget must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async getActiveRetargetingCampaigns(organizationId: string): Promise<any[]> {
    return prisma.retargetingCampaign.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    });
  }

  private async updateUserProfile(userId: string, event: any): Promise<void> {
    // Update user behavior tracking
    await prisma.userBehavior.upsert({
      where: { userId },
      update: {
        lastActivity: event.timestamp,
        behaviors: {
          push: {
            type: event.type,
            data: event.data,
            timestamp: event.timestamp
          }
        }
      },
      create: {
        userId,
        lastActivity: event.timestamp,
        behaviors: [{
          type: event.type,
          data: event.data,
          timestamp: event.timestamp
        }]
      }
    });

    // Update user interests based on event
    if (event.category) {
      await this.updateUserInterests(userId, event.category);
    }

    if (event.searchQuery) {
      await this.updateUserSearchHistory(userId, event.searchQuery);
    }
  }

  private async updateUserInterests(userId: string, category: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { interests: true }
    });

    const currentInterests = user?.interests || [];
    if (!currentInterests.includes(category)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          interests: { push: category }
        }
      });
    }
  }

  private async updateUserSearchHistory(userId: string, searchQuery: string): Promise<void> {
    await prisma.userSearchHistory.create({
      data: {
        userId,
        query: searchQuery,
        timestamp: new Date()
      }
    });
  }

  private async findEligibleCampaigns(
    userId: string,
    event: any,
    campaigns: any[]
  ): Promise<any[]> {
    const eligibleCampaigns = [];

    for (const campaign of campaigns) {
      try {
        // Check if user matches target audience
        const matchesAudience = await this.matchesTargetAudience(userId, campaign.targetAudience);
        
        // Check if event matches retargeting rules
        const matchesRules = this.matchesRetargetingRules(event, campaign.retargetingRules);
        
        // Check frequency caps
        const withinFrequencyCaps = await this.checkFrequencyCaps(userId, campaign.id, campaign.frequencyCaps);

        if (matchesAudience && matchesRules && withinFrequencyCaps) {
          eligibleCampaigns.push(campaign);
        }
      } catch (error) {
        console.error(`Error checking campaign eligibility for ${campaign.id}:`, error);
        continue;
      }
    }

    return eligibleCampaigns;
  }

  private async matchesTargetAudience(userId: string, targetAudience: any): Promise<boolean> {
    const { segments, lookalikeAudience, customRules } = targetAudience;

    // Check predefined segments
    if (segments && segments.length > 0) {
      const userSegments = await this.getUserSegments(userId);
      if (!segments.some(segmentId => userSegments.includes(segmentId))) {
        return false;
      }
    }

    // Check lookalike audience
    if (lookalikeAudience) {
      const isLookalike = await this.checkLookalikeAudience(userId, lookalikeAudience);
      if (!isLookalike) {
        return false;
      }
    }

    // Check custom rules
    if (customRules && customRules.length > 0) {
      const userProfile = await this.getUserProfile(userId);
      if (!this.matchesCustomRules(userProfile, customRules)) {
        return false;
      }
    }

    return true;
  }

  private matchesRetargetingRules(event: any, rules: RetargetingRule[]): boolean {
    for (const rule of rules) {
      if (this.matchesRule(event, rule)) {
        return true;
      }
    }
    return false;
  }

  private matchesRule(event: any, rule: RetargetingRule): boolean {
    switch (rule.type) {
      case 'PAGE_VIEW':
        return this.matchesPageViewRule(event, rule.conditions);
      case 'CART_ABANDONMENT':
        return this.matchesCartAbandonmentRule(event, rule.conditions);
      case 'PRODUCT_VIEW':
        return this.matchesProductViewRule(event, rule.conditions);
      case 'SEARCH_QUERY':
        return this.matchesSearchQueryRule(event, rule.conditions);
      case 'CUSTOM_EVENT':
        return this.matchesCustomEventRule(event, rule.conditions);
      default:
        return false;
    }
  }

  private matchesPageViewRule(event: any, conditions: any): boolean {
    if (event.type !== 'PAGE_VIEW') return false;
    
    if (conditions.pageUrl && !event.pageUrl?.includes(conditions.pageUrl)) {
      return false;
    }
    
    return true;
  }

  private matchesCartAbandonmentRule(event: any, conditions: any): boolean {
    if (event.type !== 'CART_ABANDONMENT') return false;
    
    if (conditions.minValue && event.data.cartValue < conditions.minValue) {
      return false;
    }
    
    return true;
  }

  private matchesProductViewRule(event: any, conditions: any): boolean {
    if (event.type !== 'PRODUCT_VIEW') return false;
    
    if (conditions.category && event.category !== conditions.category) {
      return false;
    }
    
    if (conditions.minPrice && event.data.price < conditions.minPrice) {
      return false;
    }
    
    return true;
  }

  private matchesSearchQueryRule(event: any, conditions: any): boolean {
    if (event.type !== 'SEARCH_QUERY') return false;
    
    if (conditions.keywords && !conditions.keywords.some((keyword: string) => 
      event.searchQuery?.toLowerCase().includes(keyword.toLowerCase())
    )) {
      return false;
    }
    
    return true;
  }

  private matchesCustomEventRule(event: any, conditions: any): boolean {
    if (event.type !== conditions.eventType) return false;
    
    // Check custom conditions
    for (const [key, value] of Object.entries(conditions.data || {})) {
      if (event.data[key] !== value) {
        return false;
      }
    }
    
    return true;
  }

  private async checkFrequencyCaps(
    userId: string,
    campaignId: string,
    frequencyCaps: any
  ): Promise<boolean> {
    const { maxImpressions, timeWindow, userLevel, campaignLevel } = frequencyCaps;

    // Check user-level frequency cap
    if (userLevel) {
      const userImpressions = await this.getUserImpressions(userId, campaignId, timeWindow);
      if (userImpressions >= maxImpressions) {
        return false;
      }
    }

    // Check campaign-level frequency cap
    if (campaignLevel) {
      const campaignImpressions = await this.getCampaignImpressions(campaignId, timeWindow);
      if (campaignImpressions >= maxImpressions) {
        return false;
      }
    }

    return true;
  }

  private generateRetargetingRecommendations(
    userId: string,
    event: any,
    campaigns: any[]
  ): any[] {
    const recommendations = [];

    for (const campaign of campaigns) {
      // Generate personalized recommendations based on event and campaign
      const recommendation = this.generateCampaignRecommendation(userId, event, campaign);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  private generateCampaignRecommendation(
    userId: string,
    event: any,
    campaign: any
  ): any {
    // Generate recommendation based on event type and campaign rules
    let description = '';
    let priority = 'MEDIUM';

    switch (event.type) {
      case 'CART_ABANDONMENT':
        description = `User abandoned cart with ${event.data.cartValue} value. Retarget with special offer.`;
        priority = 'HIGH';
        break;
      case 'PRODUCT_VIEW':
        description = `User viewed ${event.category} product. Retarget with related products.`;
        priority = 'MEDIUM';
        break;
      case 'SEARCH_QUERY':
        description = `User searched for "${event.searchQuery}". Retarget with relevant ads.`;
        priority = 'MEDIUM';
        break;
      default:
        description = 'Retarget user based on recent activity.';
        priority = 'LOW';
    }

    return {
      campaignId: campaign.id,
      description,
      priority,
      estimatedImpact: this.calculateEstimatedImpact(event, campaign),
      confidence: this.calculateConfidence(userId, campaign)
    };
  }

  private determineNextActions(
    userId: string,
    event: any,
    campaigns: any[]
  ): string[] {
    const actions = [];

    // Add actions based on event type
    switch (event.type) {
      case 'CART_ABANDONMENT':
        actions.push('SEND_ABANDONMENT_EMAIL', 'RETARGET_ADS', 'OFFER_DISCOUNT');
        break;
      case 'PRODUCT_VIEW':
        actions.push('RETARGET_PRODUCT_ADS', 'CROSS_SELL_RELATED', 'PERSONALIZE_CONTENT');
        break;
      case 'SEARCH_QUERY':
        actions.push('RETARGET_SEARCH_ADS', 'RECOMMEND_PRODUCTS', 'FOLLOW_UP_EMAIL');
        break;
      default:
        actions.push('GENERAL_RETARGETING');
    }

    // Add actions based on campaign count
    if (campaigns.length > 3) {
      actions.push('PRIORITIZE_CAMPAIGNS', 'OPTIMIZE_FREQUENCY');
    }

    return actions;
  }

  private async processPredefinedSegment(campaignId: string, segmentId: string): Promise<void> {
    // Get users in the predefined segment
    const segment = await prisma.audienceSegment.findUnique({
      where: { id: segmentId },
      include: { users: true }
    });

    if (segment) {
      // Add users to campaign audience
      for (const user of segment.users) {
        await prisma.campaignAudience.create({
          data: {
            campaignId,
            userId: user.id,
            addedAt: new Date()
          }
        });
      }
    }
  }

  private async buildLookalikeAudience(campaignId: string, lookalikeConfig: any): Promise<void> {
    // Implement lookalike audience building algorithm
    const sourceAudience = await this.getSourceAudience(lookalikeConfig.sourceSegment);
    const lookalikeUsers = await this.findLookalikeUsers(sourceAudience, lookalikeConfig.similarityThreshold);

    // Add lookalike users to campaign audience
    for (const user of lookalikeUsers) {
      await prisma.campaignAudience.create({
        data: {
          campaignId,
          userId: user.id,
          addedAt: new Date()
        }
      });
    }
  }

  private async processCustomRules(campaignId: string, rules: RetargetingRule[]): Promise<void> {
    // Process custom targeting rules to find matching users
    for (const rule of rules) {
      const matchingUsers = await this.findUsersMatchingRule(rule);
      
      // Add matching users to campaign audience
      for (const user of matchingUsers) {
        await prisma.campaignAudience.create({
          data: {
            campaignId,
            userId: user.id,
            addedAt: new Date()
          }
        });
      }
    }
  }

  // Additional helper methods (implementations would be added based on specific requirements)
  private async getUserSegments(userId: string): Promise<string[]> { return []; }
  private async checkLookalikeAudience(userId: string, config: any): Promise<boolean> { return true; }
  private async getUserProfile(userId: string): Promise<any> { return {}; }
  private matchesCustomRules(profile: any, rules: any[]): boolean { return true; }
  private async getUserImpressions(userId: string, campaignId: string, timeWindow: string): Promise<number> { return 0; }
  private async getCampaignImpressions(campaignId: string, timeWindow: string): Promise<number> { return 0; }
  private calculateEstimatedImpact(event: any, campaign: any): number { return Math.random() * 0.5 + 0.1; }
  private calculateConfidence(userId: string, campaign: any): number { return Math.random() * 0.3 + 0.7; }
  private async getSourceAudience(segmentId: string): Promise<any[]> { return []; }
  private async findLookalikeUsers(sourceAudience: any[], threshold: number): Promise<any[]> { return []; }
  private async findUsersMatchingRule(rule: RetargetingRule): Promise<any[]> { return []; }
  private async getUserRetargetingProfile(userId: string, organizationId: string): Promise<any> { return {}; }
  private async getEligibleRetargetingCampaigns(userId: string, organizationId: string): Promise<any[]> { return []; }
  private async getRecommendedAds(userId: string, campaigns: any[], context: any): Promise<any[]> { return []; }
  private async getBidRecommendations(userId: string, campaigns: any[], context: any): Promise<any[]> { return []; }
  private async getFrequencyStatus(userId: string, campaigns: any[]): Promise<any> { return {}; }
  private async updateAudienceSegmentPerformance(campaignId: string, performanceData: any): Promise<void> {}
  private async triggerOptimization(campaignId: string, performanceData: any): Promise<void> {}
} 