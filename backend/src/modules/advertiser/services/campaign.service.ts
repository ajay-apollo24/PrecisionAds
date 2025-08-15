import { prisma } from '../../../shared/database/prisma';
import { CreateCampaignData, UpdateCampaignData, CampaignFilters, CampaignWithRelations } from '../types/campaign.types';

export class CampaignService {
  /**
   * Get all campaigns for an organization with optional filtering
   */
  async getCampaigns(organizationId: string, filters: CampaignFilters = {}): Promise<CampaignWithRelations[]> {
    const where: any = { organizationId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.startDate && filters.endDate) {
      where.startDate = {
        gte: filters.startDate,
        lte: filters.endDate
      };
    }

    return prisma.advertiserCampaign.findMany({
      where,
      include: {
        ads: {
          where: { status: 'ACTIVE' },
          select: { id: true, name: true, creativeType: true, status: true }
        },
        audiences: {
          select: { id: true, name: true, description: true, size: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaignById(id: string, organizationId: string): Promise<CampaignWithRelations | null> {
    return prisma.advertiserCampaign.findFirst({
      where: { id, organizationId },
      include: {
        ads: true,
        audiences: true
      }
    });
  }

  /**
   * Create a new campaign
   */
  async createCampaign(data: CreateCampaignData, organizationId: string): Promise<CampaignWithRelations> {
    return prisma.advertiserCampaign.create({
      data: {
        ...data,
        organizationId,
        status: 'DRAFT'
      },
      include: {
        ads: [],
        audiences: []
      }
    });
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(id: string, data: UpdateCampaignData, organizationId: string): Promise<CampaignWithRelations> {
    return prisma.advertiserCampaign.update({
      where: { id, organizationId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        ads: true,
        audiences: true
      }
    });
  }

  /**
   * Delete a campaign (soft delete by setting status to CANCELLED)
   */
  async deleteCampaign(id: string, organizationId: string): Promise<CampaignWithRelations> {
    return prisma.advertiserCampaign.update({
      where: { id, organizationId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      },
      include: {
        ads: true,
        audiences: true
      }
    });
  }

  /**
   * Get campaign performance statistics
   */
  async getCampaignStats(campaignId: string, organizationId: string, startDate?: Date, endDate?: Date) {
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

    const [ads, totalSpent, totalImpressions, totalClicks, totalConversions] = await Promise.all([
      prisma.advertiserAd.count({ where: { campaignId, organizationId } }),
      prisma.advertiserCampaign.findUnique({
        where: { id: campaignId, organizationId },
        select: { totalSpent: true }
      }),
      prisma.advertiserCampaign.findUnique({
        where: { id: campaignId, organizationId },
        select: { impressions: true }
      }),
      prisma.advertiserCampaign.findUnique({
        where: { id: campaignId, organizationId },
        select: { clicks: true }
      }),
      prisma.advertiserCampaign.findUnique({
        where: { id: campaignId, organizationId },
        select: { conversions: true }
      })
    ]);

    const spent = totalSpent?.totalSpent || 0;
    const impressions = totalImpressions?.impressions || 0;
    const clicks = totalClicks?.clicks || 0;
    const conversions = totalConversions?.conversions || 0;

    return {
      totalAds: ads,
      totalSpent: spent,
      totalImpressions: impressions,
      totalClicks: clicks,
      totalConversions: conversions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      cpm: impressions > 0 ? (Number(spent) / impressions) * 1000 : 0,
      cpc: clicks > 0 ? Number(spent) / clicks : 0,
      cpa: conversions > 0 ? Number(spent) / conversions : 0
    };
  }

  /**
   * Get campaigns with performance ranking
   */
  async getTopPerformingCampaigns(organizationId: string, limit: number = 5): Promise<CampaignWithRelations[]> {
    const campaigns = await prisma.advertiserCampaign.findMany({
      where: { organizationId, status: 'ACTIVE' },
      include: {
        ads: {
          where: { status: 'ACTIVE' },
          select: { id: true, name: true, creativeType: true }
        },
        audiences: {
          select: { id: true, name: true, size: true }
        }
      }
    });

    // Calculate performance score for each campaign
    const campaignsWithScore = campaigns.map((campaign: any) => {
      const impressions = campaign.impressions || 0;
      const clicks = campaign.clicks || 0;
      const conversions = campaign.conversions || 0;
      const spent = Number(campaign.totalSpent) || 0;

      // Performance score based on engagement and efficiency
      const engagementScore = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionScore = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const efficiencyScore = spent > 0 ? (conversions / spent) * 100 : 0;

      const performanceScore = (engagementScore * 0.4) + (conversionScore * 0.4) + (efficiencyScore * 0.2);

      return {
        ...campaign,
        performanceScore
      };
    });

    // Sort by performance score and return top performers
    return campaignsWithScore
      .sort((a: any, b: any) => b.performanceScore - a.performanceScore)
      .slice(0, limit);
  }

  /**
   * Validate campaign data
   */
  validateCampaignData(data: CreateCampaignData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Campaign name is required');
    }

    if (data.budget && Number(data.budget) <= 0) {
      errors.push('Budget must be greater than 0');
    }

    if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
      errors.push('End date must be after start date');
    }

    if (data.dailyBudget && Number(data.dailyBudget) <= 0) {
      errors.push('Daily budget must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 