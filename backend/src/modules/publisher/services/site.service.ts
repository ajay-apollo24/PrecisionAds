import { prisma } from '../../../shared/database/prisma';
import { CreateSiteData, UpdateSiteData, SiteFilters, SiteWithRelations } from '../types/site.types';

export class SiteService {
  /**
   * Get all sites for an organization with optional filtering
   */
  async getSites(organizationId: string, filters: SiteFilters = {}): Promise<SiteWithRelations[]> {
    const where: any = { organizationId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.domain) {
      where.domain = { contains: filters.domain, mode: 'insensitive' };
    }

    return prisma.publisherSite.findMany({
      where,
      include: {
        adUnits: {
          where: { status: 'ACTIVE' },
          select: { id: true, name: true, format: true, status: true }
        },
        earnings: {
          orderBy: { date: 'desc' },
          take: 7, // Last 7 days
          select: { date: true, revenue: true, impressions: true, clicks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get a single site by ID
   */
  async getSiteById(id: string, organizationId: string): Promise<SiteWithRelations | null> {
    return prisma.publisherSite.findFirst({
      where: { id, organizationId },
      include: {
        adUnits: true,
        earnings: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days
        }
      }
    });
  }

  /**
   * Create a new site
   */
  async createSite(data: CreateSiteData, organizationId: string): Promise<SiteWithRelations> {
    return prisma.publisherSite.create({
      data: {
        ...data,
        organizationId,
        status: 'PENDING'
      },
      include: {
        adUnits: true,
        earnings: []
      }
    });
  }

  /**
   * Update an existing site
   */
  async updateSite(id: string, data: UpdateSiteData, organizationId: string): Promise<SiteWithRelations> {
    return prisma.publisherSite.update({
      where: { id, organizationId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        adUnits: true,
        earnings: []
      }
    });
  }

  /**
   * Delete a site (soft delete by setting status to INACTIVE)
   */
  async deleteSite(id: string, organizationId: string): Promise<SiteWithRelations> {
    return prisma.publisherSite.update({
      where: { id, organizationId },
      data: { 
        status: 'INACTIVE',
        updatedAt: new Date()
      },
      include: {
        adUnits: true,
        earnings: []
      }
    });
  }

  /**
   * Get site statistics
   */
  async getSiteStats(siteId: string, organizationId: string, startDate?: Date, endDate?: Date) {
    const where: any = { 
      siteId,
      organizationId 
    };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const [earnings, adUnits, adRequests] = await Promise.all([
      prisma.publisherEarning.aggregate({
        where,
        _sum: {
          impressions: true,
          clicks: true,
          revenue: true
        }
      }),
      prisma.adUnit.count({ where: { siteId, organizationId, status: 'ACTIVE' } }),
      prisma.adRequest.count({ where: { siteId, organizationId } })
    ]);

    return {
      totalImpressions: earnings._sum.impressions || 0,
      totalClicks: earnings._sum.clicks || 0,
      totalRevenue: earnings._sum.revenue || 0,
      activeAdUnits: adUnits,
      totalAdRequests: adRequests,
      ctr: earnings._sum.impressions && earnings._sum.impressions > 0 
        ? (earnings._sum.clicks || 0) / earnings._sum.impressions * 100 
        : 0
    };
  }

  /**
   * Get sites with performance ranking
   */
  async getTopPerformingSites(organizationId: string, limit: number = 5): Promise<SiteWithRelations[]> {
    const sites = await prisma.publisherSite.findMany({
      where: { organizationId, status: 'ACTIVE' },
      include: {
        earnings: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days
        }
      }
    });

    // Calculate performance score for each site
    const sitesWithScore = sites.map(site => {
      const totalRevenue = site.earnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
      const totalImpressions = site.earnings.reduce((sum, earning) => sum + earning.impressions, 0);
      const totalClicks = site.earnings.reduce((sum, earning) => sum + earning.clicks, 0);
      
      const performanceScore = (totalRevenue * 0.5) + (totalImpressions * 0.3) + (totalClicks * 0.2);
      
      return {
        ...site,
        performanceScore
      };
    });

    // Sort by performance score and return top performers
    return sitesWithScore
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, limit);
  }
} 