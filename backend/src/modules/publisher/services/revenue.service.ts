import { prisma } from '../../../shared/database/prisma';
import { EarningsFilters, EarningsSummary, RevenueStats } from '../types/earnings.types';

export class RevenueService {
  /**
   * Get earnings for a specific site
   */
  async getSiteEarnings(
    siteId: string,
    organizationId: string,
    filters: EarningsFilters = {}
  ): Promise<RevenueStats> {
    const where: any = { siteId, organizationId };

    if (filters.startDate && filters.endDate) {
      where.date = {
        gte: filters.startDate,
        lte: filters.endDate
      };
    }

    const earnings = await prisma.publisherEarning.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    return this.calculateRevenueStats(earnings);
  }

  /**
   * Get organization-wide earnings summary
   */
  async getOrganizationEarnings(
    organizationId: string,
    filters: EarningsFilters = {}
  ): Promise<EarningsSummary> {
    const where: any = { organizationId };

    if (filters.startDate && filters.endDate) {
      where.date = {
        gte: filters.startDate,
        lte: filters.endDate
      };
    }

    const [earnings, sites] = await Promise.all([
      prisma.publisherEarning.findMany({ where }),
      prisma.publisherSite.findMany({
        where: { organizationId, status: 'ACTIVE' },
        include: {
          earnings: {
            where: filters.startDate && filters.endDate ? {
              date: {
                gte: filters.startDate,
                lte: filters.endDate
              }
            } : {},
            orderBy: { date: 'desc' },
            take: 30 // Last 30 days
          }
        }
      })
    ]);

    const totalStats = this.calculateRevenueStats(earnings);
    const topPerformingSites = this.getTopPerformingSites(sites);

    return {
      totalStats,
      topPerformingSites,
      siteCount: sites.length,
      averageRevenuePerSite: sites.length > 0 ? totalStats.totalRevenue / sites.length : 0
    };
  }

  /**
   * Get earnings breakdown by time period
   */
  async getEarningsBreakdown(
    organizationId: string,
    period: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const where = {
      organizationId,
      date: {
        gte: startDate,
        lte: endDate
      }
    };

    let groupBy: string;
    let dateFormat: string;

    switch (period) {
      case 'daily':
        groupBy = 'DATE_TRUNC(\'day\', date)';
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'weekly':
        groupBy = 'DATE_TRUNC(\'week\', date)';
        dateFormat = 'YYYY-WW';
        break;
      case 'monthly':
        groupBy = 'DATE_TRUNC(\'month\', date)';
        dateFormat = 'YYYY-MM';
        break;
      default:
        groupBy = 'DATE_TRUNC(\'day\', date)';
        dateFormat = 'YYYY-MM-DD';
    }

    // Use raw SQL for flexible date grouping
    const breakdown = await prisma.$queryRaw`
      SELECT 
        ${groupBy} as period,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(revenue) as total_revenue,
        AVG(cpm) as avg_cpm,
        AVG(cpc) as avg_cpc
      FROM publisher_earnings 
      WHERE "organizationId" = ${organizationId}
        AND date >= ${startDate}
        AND date <= ${endDate}
      GROUP BY ${groupBy}
      ORDER BY period DESC
    `;

    return breakdown;
  }

  /**
   * Calculate revenue statistics from earnings data
   */
  private calculateRevenueStats(earnings: any[]): RevenueStats {
    if (earnings.length === 0) {
      return {
        totalImpressions: 0,
        totalClicks: 0,
        totalRevenue: 0,
        averageCPM: 0,
        averageCPC: 0,
        ctr: 0,
        totalDays: 0
      };
    }

    const totalImpressions = earnings.reduce((sum, earning) => sum + earning.impressions, 0);
    const totalClicks = earnings.reduce((sum, earning) => sum + earning.clicks, 0);
    const totalRevenue = earnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
    const totalCPM = earnings.reduce((sum, earning) => sum + Number(earning.cpm), 0);
    const totalCPC = earnings.reduce((sum, earning) => sum + Number(earning.cpc), 0);

    return {
      totalImpressions,
      totalClicks,
      totalRevenue,
      averageCPM: totalCPM / earnings.length,
      averageCPC: totalCPC / earnings.length,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      totalDays: earnings.length
    };
  }

  /**
   * Get top performing sites by revenue
   */
  private getTopPerformingSites(sites: any[]): any[] {
    return sites
      .map(site => {
        const totalRevenue = site.earnings.reduce((sum: number, earning: any) => sum + Number(earning.revenue), 0);
        const totalImpressions = site.earnings.reduce((sum: number, earning: any) => sum + earning.impressions, 0);
        const totalClicks = site.earnings.reduce((sum: number, earning: any) => sum + earning.clicks, 0);
        
        return {
          id: site.id,
          name: site.name,
          domain: site.domain,
          totalRevenue,
          totalImpressions,
          totalClicks,
          ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5); // Top 5 sites
  }

  /**
   * Calculate revenue projections based on historical data
   */
  async calculateRevenueProjections(
    organizationId: string,
    days: number = 30
  ): Promise<{ projectedRevenue: number; confidence: number; factors: any }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const earnings = await prisma.publisherEarning.findMany({
      where: {
        organizationId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    if (earnings.length < 7) {
      return {
        projectedRevenue: 0,
        confidence: 0,
        factors: { message: 'Insufficient data for projection' }
      };
    }

    // Calculate daily average revenue
    const totalRevenue = earnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
    const dailyAverage = totalRevenue / earnings.length;

    // Calculate growth trend
    const recentEarnings = earnings.slice(-7); // Last 7 days
    const olderEarnings = earnings.slice(0, 7); // First 7 days
    
    const recentRevenue = recentEarnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
    const olderRevenue = olderEarnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
    
    const growthRate = olderRevenue > 0 ? (recentRevenue - olderRevenue) / olderRevenue : 0;

    // Project revenue for next 30 days
    const projectedRevenue = dailyAverage * 30 * (1 + growthRate);
    const confidence = Math.min(0.9, Math.max(0.3, 0.7 + (earnings.length / 100)));

    return {
      projectedRevenue: Math.max(0, projectedRevenue),
      confidence,
      factors: {
        dailyAverage,
        growthRate,
        dataPoints: earnings.length,
        period: days
      }
    };
  }

  /**
   * Get revenue alerts and notifications
   */
  async getRevenueAlerts(organizationId: string): Promise<any[]> {
    const alerts: any[] = [];
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Check for significant revenue drops
    const recentEarnings = await prisma.publisherEarning.findMany({
      where: {
        organizationId,
        date: {
          gte: yesterday
        }
      }
    });

    if (recentEarnings.length > 0) {
      const recentRevenue = recentEarnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
      
      // Get previous day's revenue for comparison
      const previousDay = new Date(yesterday.getTime() - 24 * 60 * 60 * 1000);
      const previousEarnings = await prisma.publisherEarning.findMany({
        where: {
          organizationId,
          date: {
            gte: previousDay,
            lt: yesterday
          }
        }
      });

      if (previousEarnings.length > 0) {
        const previousRevenue = previousEarnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
        const revenueChange = previousRevenue > 0 ? (recentRevenue - previousRevenue) / previousRevenue : 0;

        if (revenueChange < -0.2) { // 20% drop
          alerts.push({
            type: 'REVENUE_DROP',
            severity: 'HIGH',
            message: `Revenue dropped by ${Math.abs(revenueChange * 100).toFixed(1)}% compared to previous day`,
            revenueChange,
            currentRevenue: recentRevenue,
            previousRevenue
          });
        }
      }
    }

    return alerts;
  }
} 