import { prisma } from '../../../shared/database/prisma';
import { CreateAdData, UpdateAdData, AdFilters, AdWithRelations } from '../types/ad.types';

export class AdService {
  /**
   * Get all ads for a campaign with optional filtering
   */
  async getAds(campaignId: string, organizationId: string, filters: AdFilters = {}): Promise<AdWithRelations[]> {
    const where: any = { campaignId, organizationId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.creativeType) {
      where.creativeType = filters.creativeType;
    }

    return prisma.advertiserAd.findMany({
      where,
      include: {
        campaign: {
          select: { id: true, name: true, status: true, type: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get a single ad by ID
   */
  async getAdById(id: string, organizationId: string): Promise<AdWithRelations | null> {
    return prisma.advertiserAd.findFirst({
      where: { id, organizationId },
      include: {
        campaign: {
          select: { id: true, name: true, status: true, type: true }
        }
      }
    });
  }

  /**
   * Create a new ad
   */
  async createAd(data: CreateAdData, organizationId: string): Promise<AdWithRelations> {
    const createdAd = await prisma.advertiserAd.create({
      data: {
        ...data,
        organizationId,
        status: 'DRAFT',
        targeting: data.targeting as any // Cast to Prisma's expected type
      }
    });

    // Get campaign info for the relation
    const campaign = await prisma.advertiserCampaign.findFirst({
      where: { id: data.campaignId },
      select: { id: true, name: true, status: true, type: true }
    });

    // Return with campaign relation
    return {
      ...createdAd,
      campaign: campaign || { id: data.campaignId, name: 'Unknown', status: 'UNKNOWN', type: 'UNKNOWN' }
    } as AdWithRelations;
  }

  /**
   * Update an existing ad
   */
  async updateAd(id: string, data: UpdateAdData, organizationId: string): Promise<AdWithRelations> {
    const updateData: any = {
      ...data,
      updatedAt: new Date()
    };

    // Handle targeting field separately
    if (data.targeting !== undefined) {
      updateData.targeting = data.targeting as any;
    }

    const updatedAd = await prisma.advertiserAd.update({
      where: { id, organizationId },
      data: updateData
    });

    // Get campaign info for the relation
    const campaign = await prisma.advertiserCampaign.findFirst({
      where: { id: updatedAd.campaignId },
      select: { id: true, name: true, status: true, type: true }
    });

    // Return with campaign relation
    return {
      ...updatedAd,
      campaign: campaign || { id: updatedAd.campaignId, name: 'Unknown', status: 'UNKNOWN', type: 'UNKNOWN' }
    } as AdWithRelations;
  }

  /**
   * Delete an ad (soft delete by setting status to REJECTED)
   */
  async deleteAd(id: string, organizationId: string): Promise<AdWithRelations> {
    return prisma.advertiserAd.update({
      where: { id, organizationId },
      data: {
        status: 'REJECTED',
        updatedAt: new Date()
      },
      include: {
        campaign: {
          select: { id: true, name: true, status: true, type: true }
        }
      }
    });
  }

  /**
   * Get ad performance statistics
   */
  async getAdStats(adId: string, organizationId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      id: adId,
      organizationId
    };

    const ad = await prisma.advertiserAd.findFirst({
      where,
      select: {
        impressions: true,
        clicks: true,
        conversions: true,
        ctr: true,
        cpc: true,
        cpm: true
      }
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    return {
      totalImpressions: ad.impressions || 0,
      totalClicks: ad.clicks || 0,
      totalConversions: ad.conversions || 0,
      ctr: Number(ad.ctr) || 0,
      cpc: Number(ad.cpc) || 0,
      cpm: Number(ad.cpm) || 0,
      conversionRate: ad.clicks && ad.clicks > 0 ? (ad.conversions || 0) / ad.clicks * 100 : 0
    };
  }

  /**
   * Get ads with performance ranking
   */
  async getTopPerformingAds(campaignId: string, organizationId: string, limit: number = 5): Promise<AdWithRelations[]> {
    const ads = await prisma.advertiserAd.findMany({
      where: { campaignId, organizationId, status: 'ACTIVE' },
      include: {
        campaign: {
          select: { id: true, name: true, status: true, type: true }
        }
      }
    });

    // Calculate performance score for each ad
    const adsWithScore = ads.map((ad: any) => {
      const impressions = ad.impressions || 0;
      const clicks = ad.clicks || 0;
      const conversions = ad.conversions || 0;

      // Performance score based on CTR and conversion rate
      const ctrScore = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionScore = clicks > 0 ? (conversions / clicks) * 100 : 0;

      const performanceScore = (ctrScore * 0.6) + (conversionScore * 0.4);

      return {
        ...ad,
        performanceScore
      };
    });

    // Sort by performance score and return top performers
    return adsWithScore
      .sort((a: any, b: any) => b.performanceScore - a.performanceScore)
      .slice(0, limit);
  }

  /**
   * Validate ad data
   */
  validateAdData(data: CreateAdData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Ad name is required');
    }

    if (!data.creativeUrl || data.creativeUrl.trim().length === 0) {
      errors.push('Creative URL is required');
    }

    if (!data.landingPageUrl || data.landingPageUrl.trim().length === 0) {
      errors.push('Landing page URL is required');
    }

    if (data.weight && (data.weight < 1 || data.weight > 100)) {
      errors.push('Weight must be between 1 and 100');
    }

    // Validate URLs
    try {
      new URL(data.creativeUrl);
    } catch {
      errors.push('Creative URL must be a valid URL');
    }

    try {
      new URL(data.landingPageUrl);
    } catch {
      errors.push('Landing page URL must be a valid URL');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 