import { prisma } from '../../../shared/database/prisma';
import { CreateAudienceData, UpdateAudienceData, AudienceFilters, AudienceWithRelations } from '../types/audience.types';

export class AudienceService {
  /**
   * Get all audiences for a campaign with optional filtering
   */
  async getAudiences(campaignId: string, organizationId: string, filters: AudienceFilters = {}): Promise<AudienceWithRelations[]> {
    const where: any = { campaignId, organizationId };

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }

    return prisma.advertiserAudience.findMany({
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
   * Get a single audience by ID
   */
  async getAudienceById(id: string, organizationId: string): Promise<AudienceWithRelations | null> {
    return prisma.advertiserAudience.findFirst({
      where: { id, organizationId },
      include: {
        campaign: {
          select: { id: true, name: true, status: true, type: true }
        }
      }
    });
  }

  /**
   * Create a new audience
   */
  async createAudience(data: CreateAudienceData, organizationId: string): Promise<AudienceWithRelations> {
    const created = await prisma.advertiserAudience.create({
      data: {
        ...data,
        organizationId,
        targeting: data.targeting as any
      }
    });

    const campaign = await prisma.advertiserCampaign.findFirst({
      where: { id: created.campaignId },
      select: { id: true, name: true, status: true, type: true }
    });

    return {
      ...created,
      campaign: campaign || { id: created.campaignId, name: 'Unknown', status: 'UNKNOWN', type: 'UNKNOWN' }
    } as AudienceWithRelations;
  }

  /**
   * Update an existing audience
   */
  async updateAudience(id: string, data: UpdateAudienceData, organizationId: string): Promise<AudienceWithRelations> {
    const updateData: any = {
      ...data,
      updatedAt: new Date()
    };
    if (data.targeting !== undefined) {
      updateData.targeting = data.targeting as any;
    }

    const updated = await prisma.advertiserAudience.update({
      where: { id, organizationId },
      data: updateData
    });

    const campaign = await prisma.advertiserCampaign.findFirst({
      where: { id: updated.campaignId },
      select: { id: true, name: true, status: true, type: true }
    });

    return {
      ...updated,
      campaign: campaign || { id: updated.campaignId, name: 'Unknown', status: 'UNKNOWN', type: 'UNKNOWN' }
    } as AudienceWithRelations;
  }

  /**
   * Delete an audience
   */
  async deleteAudience(id: string, organizationId: string): Promise<AudienceWithRelations> {
    return prisma.advertiserAudience.delete({
      where: { id, organizationId },
      include: {
        campaign: {
          select: { id: true, name: true, status: true, type: true }
        }
      }
    });
  }

  /**
   * Estimate audience size based on targeting criteria
   */
  async estimateAudienceSize(targeting: Record<string, any>): Promise<number> {
    // This is a simplified estimation - in production, you would use
    // real audience data and sophisticated algorithms
    let estimatedSize = 1000000; // Base size

    if (targeting.geoLocation) {
      // Adjust based on geographic targeting
      if (targeting.geoLocation.country) {
        estimatedSize *= 0.3; // Country-level targeting
      } else if (targeting.geoLocation.region) {
        estimatedSize *= 0.1; // Region-level targeting
      } else if (targeting.geoLocation.city) {
        estimatedSize *= 0.05; // City-level targeting
      }
    }

    if (targeting.demographics) {
      // Adjust based on demographic targeting
      if (targeting.demographics.ageRange) {
        estimatedSize *= 0.4; // Age targeting
      }
      if (targeting.demographics.gender) {
        estimatedSize *= 0.5; // Gender targeting
      }
    }

    if (targeting.interests && Array.isArray(targeting.interests)) {
      // Adjust based on interest targeting
      estimatedSize *= Math.pow(0.7, targeting.interests.length);
    }

    if (targeting.behaviors && Array.isArray(targeting.behaviors)) {
      // Adjust based on behavioral targeting
      estimatedSize *= Math.pow(0.8, targeting.behaviors.length);
    }

    return Math.max(1000, Math.round(estimatedSize));
  }

  /**
   * Get audience insights and analytics
   */
  async getAudienceInsights(audienceId: string, organizationId: string) {
    const audience = await prisma.advertiserAudience.findFirst({
      where: { id: audienceId, organizationId },
      select: {
        targeting: true,
        size: true,
        createdAt: true
      }
    });

    if (!audience) {
      throw new Error('Audience not found');
    }

    // This would typically integrate with analytics platforms
    // For now, returning mock insights
    const targeting = audience.targeting as Record<string, any>;
    
    return {
      audienceId,
      estimatedSize: audience.size || 0,
      targetingBreakdown: {
        geographic: targeting.geoLocation || 'Not specified',
        demographic: targeting.demographics || 'Not specified',
        interests: targeting.interests || [],
        behaviors: targeting.behaviors || []
      },
      reachEstimate: {
        potential: audience.size || 0,
        actual: Math.round((audience.size || 0) * 0.3), // 30% reach estimate
        overlap: Math.round((audience.size || 0) * 0.1) // 10% overlap estimate
      },
      performanceMetrics: {
        avgCTR: 2.5, // Mock average CTR
        avgConversionRate: 0.8, // Mock average conversion rate
        avgCPM: 3.50, // Mock average CPM
        qualityScore: 8.5 // Mock quality score
      }
    };
  }

  /**
   * Validate audience data
   */
  validateAudienceData(data: CreateAudienceData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Audience name is required');
    }

    if (!data.targeting || (typeof data.targeting === 'object' && Object.keys(data.targeting as any).length === 0)) {
      errors.push('Targeting criteria are required');
    }

    if (data.size && data.size <= 0) {
      errors.push('Audience size must be greater than 0');
    }

    // Validate targeting structure
    if (data.targeting) {
      const t = data.targeting as any;
      if (t.geoLocation && typeof t.geoLocation !== 'object') {
        errors.push('Geographic targeting must be an object');
      }

      if (t.demographics && typeof t.demographics !== 'object') {
        errors.push('Demographic targeting must be an object');
      }

      if (t.interests && !Array.isArray(t.interests)) {
        errors.push('Interests must be an array');
      }

      if (t.behaviors && !Array.isArray(t.behaviors)) {
        errors.push('Behaviors must be an array');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 