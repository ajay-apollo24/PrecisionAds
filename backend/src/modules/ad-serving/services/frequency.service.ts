import { prisma } from '../../../shared/database/prisma';

export class FrequencyService {
  /**
   * Check if an ad can be shown to a user based on frequency caps
   */
  async checkFrequencyCap(
    userId: string,
    adId: string,
    campaignId: string,
    organizationId: string,
    eventType: 'impression' | 'click' = 'impression'
  ): Promise<{
    allowed: boolean;
    reason: string;
    currentCount: number;
    limit: number;
    timeRemaining: number;
  }> {
    try {
      // Get frequency cap settings from campaign
      const campaign = await prisma.advertiserCampaign.findFirst({
        where: { id: campaignId, organizationId }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // For now, use default frequency caps since settings field doesn't exist in schema
      const frequencyCaps = {
        impression: { limit: 3, window: 'day' },
        click: { limit: 1, window: 'day' }
      };
      const cap = frequencyCaps[eventType];

      if (!cap) {
        return {
          allowed: true,
          reason: 'No frequency cap set for this event type',
          currentCount: 0,
          limit: 0,
          timeRemaining: 0
        };
      }

      // Check current frequency count
      const currentCount = await this.getCurrentFrequencyCount(
        userId,
        adId,
        campaignId,
        organizationId,
        eventType,
        cap.window
      );

      const allowed = currentCount < cap.limit;
      const timeRemaining = this.calculateTimeRemaining(cap.window);

      return {
        allowed,
        reason: allowed ? 'Frequency cap not exceeded' : 'Frequency cap exceeded',
        currentCount,
        limit: cap.limit,
        timeRemaining
      };
    } catch (error) {
      throw new Error(`Frequency cap check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Record a frequency cap event
   */
  async recordFrequencyEvent(
    userId: string,
    adId: string,
    campaignId: string,
    organizationId: string,
    eventType: 'impression' | 'click'
  ): Promise<void> {
    try {
      const campaign = await prisma.advertiserCampaign.findFirst({
        where: { id: campaignId, organizationId }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // For now, use default frequency caps since settings field doesn't exist in schema
      const frequencyCaps = {
        impression: { limit: 3, window: 'day' },
        click: { limit: 1, window: 'day' }
      };
      const cap = frequencyCaps[eventType];

      if (!cap) {
        return; // No frequency cap set
      }

      const { windowStart, windowEnd } = this.calculateTimeWindow(cap.window);

      // Create or update frequency cap record
      await prisma.frequencyCap.upsert({
        where: {
          id: `${userId}-${adId}-${eventType}-${windowStart.getTime()}`
        },
        update: {
          count: {
            increment: 1
          }
        },
        create: {
          organizationId,
          campaignId,
          adId,
          userId,
          eventType,
          count: 1,
          windowStart,
          windowEnd
        }
      });
    } catch (error) {
      throw new Error(`Failed to record frequency event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current frequency count for a user
   */
  private async getCurrentFrequencyCount(
    userId: string,
    adId: string,
    campaignId: string,
    organizationId: string,
    eventType: string,
    window: string
  ): Promise<number> {
    const { windowStart, windowEnd } = this.calculateTimeWindow(window);

    const frequencyCap = await prisma.frequencyCap.findFirst({
      where: {
        userId,
        adId,
        campaignId,
        organizationId,
        eventType,
        windowStart: {
          gte: windowStart
        },
        windowEnd: {
          lte: windowEnd
        }
      },
      select: { count: true }
    });

    return frequencyCap?.count || 0;
  }

  /**
   * Calculate time window based on frequency cap setting
   */
  private calculateTimeWindow(window: string): { windowStart: Date; windowEnd: Date } {
    const now = new Date();
    let windowStart: Date;
    let windowEnd: Date;

    switch (window) {
      case 'hour':
        windowStart = new Date(now.getTime() - 60 * 60 * 1000);
        windowEnd = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case 'day':
        windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'week':
        windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        windowEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    return { windowStart, windowEnd };
  }

  /**
   * Calculate time remaining in current window
   */
  private calculateTimeRemaining(window: string): number {
    const now = new Date();
    let windowEnd: Date;

    switch (window) {
      case 'hour':
        windowEnd = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case 'day':
        windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'week':
        windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        windowEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    return Math.max(0, windowEnd.getTime() - now.getTime());
  }

  /**
   * Get frequency cap analytics for a campaign
   */
  async getFrequencyAnalytics(
    campaignId: string,
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEvents: number;
    uniqueUsers: number;
    averageEventsPerUser: number;
    topUsers: Array<{ userId: string; eventCount: number }>;
    eventBreakdown: Record<string, number>;
  }> {
    try {
      const where: any = {
        campaignId,
        organizationId
      };

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate
        };
      }

      const frequencyCaps = await prisma.frequencyCap.findMany({
        where,
        select: {
          userId: true,
          eventType: true,
          count: true,
          createdAt: true
        }
      });

      const totalEvents = frequencyCaps.reduce((sum, fc) => sum + fc.count, 0);
      const uniqueUsers = new Set(frequencyCaps.map(fc => fc.userId)).size;
      const averageEventsPerUser = uniqueUsers > 0 ? totalEvents / uniqueUsers : 0;

      // Get top users by event count
      const userEventCounts = new Map<string, number>();
      frequencyCaps.forEach(fc => {
        const current = userEventCounts.get(fc.userId) || 0;
        userEventCounts.set(fc.userId, current + fc.count);
      });

      const topUsers = Array.from(userEventCounts.entries())
        .map(([userId, eventCount]) => ({ userId, eventCount }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 10);

      // Get event breakdown by type
      const eventBreakdown: Record<string, number> = {};
      frequencyCaps.forEach(fc => {
        eventBreakdown[fc.eventType] = (eventBreakdown[fc.eventType] || 0) + fc.count;
      });

      return {
        totalEvents,
        uniqueUsers,
        averageEventsPerUser,
        topUsers,
        eventBreakdown
      };
    } catch (error) {
      throw new Error(`Failed to get frequency analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reset frequency caps for a user (admin function)
   */
  async resetFrequencyCaps(
    userId: string,
    campaignId: string,
    organizationId: string
  ): Promise<void> {
    try {
      await prisma.frequencyCap.deleteMany({
        where: {
          userId,
          campaignId,
          organizationId
        }
      });
    } catch (error) {
      throw new Error(`Failed to reset frequency caps: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recommended frequency cap settings based on campaign performance
   */
  async getRecommendedFrequencyCaps(
    campaignId: string,
    organizationId: string
  ): Promise<{
    impression: { limit: number; window: string };
    click: { limit: number; window: string };
    reasoning: string;
  }> {
    try {
      // Get campaign performance data
      const campaign = await prisma.advertiserCampaign.findFirst({
        where: { id: campaignId, organizationId },
        select: {
          impressions: true,
          clicks: true,
          conversions: true,
          totalSpent: true
        }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Calculate performance metrics
      const ctr = campaign.impressions > 0 ? campaign.clicks / campaign.impressions : 0;
      const conversionRate = campaign.clicks > 0 ? campaign.conversions / campaign.clicks : 0;
      const cpm = campaign.impressions > 0 ? (Number(campaign.totalSpent) / campaign.impressions) * 1000 : 0;

      // Recommend frequency caps based on performance
      let impressionLimit = 3;
      let clickLimit = 1;
      let reasoning = '';

      if (ctr > 0.05) { // High CTR
        impressionLimit = 5;
        reasoning = 'High CTR suggests good ad relevance, allowing more impressions';
      } else if (ctr < 0.01) { // Low CTR
        impressionLimit = 2;
        reasoning = 'Low CTR suggests poor ad relevance, limiting impressions';
      }

      if (conversionRate > 0.02) { // High conversion rate
        clickLimit = 2;
        reasoning += '. High conversion rate suggests good landing page, allowing more clicks';
      } else if (conversionRate < 0.005) { // Low conversion rate
        clickLimit = 1;
        reasoning += '. Low conversion rate suggests poor landing page, limiting clicks';
      }

      return {
        impression: { limit: impressionLimit, window: 'day' },
        click: { limit: clickLimit, window: 'day' },
        reasoning: reasoning || 'Standard frequency caps based on campaign performance'
      };
    } catch (error) {
      throw new Error(`Failed to get recommended frequency caps: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 