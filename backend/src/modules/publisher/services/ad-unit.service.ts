import { prisma } from '../../../shared/database/prisma';
import { CreateAdUnitData, UpdateAdUnitData, AdUnitFilters, AdUnitWithRelations } from '../types/ad-unit.types';

export class AdUnitService {
  /**
   * Get all ad units for a site with optional filtering
   */
  async getAdUnits(siteId: string, organizationId: string, filters: AdUnitFilters = {}): Promise<AdUnitWithRelations[]> {
    const where: any = { siteId, organizationId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.format) {
      where.format = filters.format;
    }

    return prisma.adUnit.findMany({
      where,
      include: {
        site: {
          select: { id: true, name: true, domain: true }
        },
        adRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 requests
          select: { id: true, status: true, createdAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get a single ad unit by ID
   */
  async getAdUnitById(id: string, organizationId: string): Promise<AdUnitWithRelations | null> {
    return prisma.adUnit.findFirst({
      where: { id, organizationId },
      include: {
        site: {
          select: { id: true, name: true, domain: true }
        },
        adRequests: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });
  }

  /**
   * Create a new ad unit
   */
  async createAdUnit(data: CreateAdUnitData, organizationId: string): Promise<AdUnitWithRelations> {
    return prisma.adUnit.create({
      data: {
        ...data,
        organizationId,
        status: 'INACTIVE'
      },
      include: {
        site: {
          select: { id: true, name: true, domain: true }
        },
        adRequests: []
      }
    });
  }

  /**
   * Update an existing ad unit
   */
  async updateAdUnit(id: string, data: UpdateAdUnitData, organizationId: string): Promise<AdUnitWithRelations> {
    return prisma.adUnit.update({
      where: { id, organizationId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        site: {
          select: { id: true, name: true, domain: true }
        },
        adRequests: []
      }
    });
  }

  /**
   * Delete an ad unit (soft delete by setting status to INACTIVE)
   */
  async deleteAdUnit(id: string, organizationId: string): Promise<AdUnitWithRelations> {
    return prisma.adUnit.update({
      where: { id, organizationId },
      data: { 
        status: 'INACTIVE',
        updatedAt: new Date()
      },
      include: {
        site: {
          select: { id: true, name: true, domain: true }
        },
        adRequests: []
      }
    });
  }

  /**
   * Get ad unit performance statistics
   */
  async getAdUnitStats(adUnitId: string, organizationId: string, startDate?: Date, endDate?: Date) {
    const where: any = { 
      adUnitId,
      organizationId 
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }

    const [adRequests, impressions, clicks] = await Promise.all([
      prisma.adRequest.count({ where }),
      prisma.adRequest.count({ where: { ...where, impression: true } }),
      prisma.adRequest.count({ where: { ...where, clickThrough: true } })
    ]);

    return {
      totalRequests: adRequests,
      totalImpressions: impressions,
      totalClicks: clicks,
      ctr: adRequests > 0 ? (clicks / adRequests) * 100 : 0
    };
  }

  /**
   * Get ad units with performance ranking
   */
  async getTopPerformingAdUnits(siteId: string, organizationId: string, limit: number = 5): Promise<AdUnitWithRelations[]> {
    const adUnits = await prisma.adUnit.findMany({
      where: { siteId, organizationId, status: 'ACTIVE' },
      include: {
        adRequests: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }
      }
    });

    // Calculate performance score for each ad unit
    const adUnitsWithScore = adUnits.map(adUnit => {
      const totalRequests = adUnit.adRequests.length;
      const totalImpressions = adUnit.adRequests.filter(req => req.impression).length;
      const totalClicks = adUnit.adRequests.filter(req => req.clickThrough).length;
      
      const performanceScore = (totalImpressions * 0.4) + (totalClicks * 0.6);
      
      return {
        ...adUnit,
        performanceScore
      };
    });

    // Sort by performance score and return top performers
    return adUnitsWithScore
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, limit);
  }

  /**
   * Validate ad unit settings
   */
  validateAdUnitSettings(settings: Record<string, any>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.targeting) {
      if (typeof settings.targeting !== 'object') {
        errors.push('Targeting must be an object');
      }
    }

    if (settings.frequencyCaps) {
      if (typeof settings.frequencyCaps !== 'object') {
        errors.push('Frequency caps must be an object');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 