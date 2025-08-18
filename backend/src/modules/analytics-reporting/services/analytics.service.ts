import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  campaignId?: string;
  adId?: string;
  organizationId: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  limit?: number;
}

export interface PerformanceMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

export interface AnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalSpend: number;
  avgCTR: number;
  avgCPC: number;
  avgCPM: number;
  conversionRate: number;
  roas: number;
}

export class AnalyticsService {
  /**
   * Get comprehensive performance analytics with filtering and grouping
   */
  async getPerformanceAnalytics(filters: AnalyticsFilters) {
    const { startDate, endDate, campaignId, adId, organizationId, groupBy = 'day' } = filters;

    const where: any = { organizationId };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (adId) {
      where.adId = adId;
    }

    let performanceData: any[];
    if (groupBy === 'hour') {
      performanceData = await this.getHourlyData(where);
    } else if (groupBy === 'week') {
      performanceData = await this.getWeeklyData(where);
    } else if (groupBy === 'month') {
      performanceData = await this.getMonthlyData(where);
    } else {
      performanceData = await prisma.performanceMetrics.findMany({
        where,
        orderBy: { date: 'desc' }
      });
    }

    const aggregated = this.calculateAggregatedMetrics(performanceData);
    const summary = this.calculateSummaryMetrics(aggregated);

    return {
      performanceData,
      aggregated,
      summary
    };
  }

  /**
   * Get performance comparison between two periods
   */
  async getPerformanceComparison(
    organizationId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ) {
    const [period1Data, period2Data] = await Promise.all([
      this.getPeriodMetrics(organizationId, period1Start, period1End),
      this.getPeriodMetrics(organizationId, period2Start, period2End)
    ]);

    const changes = {
      impressions: this.calculateChange(period1Data.impressions, period2Data.impressions),
      clicks: this.calculateChange(period1Data.clicks, period2Data.clicks),
      conversions: this.calculateChange(period1Data.conversions, period2Data.conversions),
      revenue: this.calculateChange(period1Data.revenue, period2Data.revenue)
    };

    return {
      period1: { start: period1Start, end: period1End, data: period1Data },
      period2: { start: period2Start, end: period2End, data: period2Data },
      changes,
      insights: this.generateInsights(changes)
    };
  }

  /**
   * Get performance breakdown by dimensions
   */
  async getPerformanceBreakdown(
    organizationId: string,
    dimension: string,
    filters: Omit<AnalyticsFilters, 'groupBy'>
  ) {
    const { startDate, endDate, limit = 10 } = filters;
    const where: any = { organizationId };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const breakdown = await prisma.performanceMetrics.groupBy({
      by: [dimension as keyof typeof prisma.performanceMetrics.fields],
      where,
      _sum: {
        impressions: true,
        clicks: true,
        conversions: true,
        revenue: true
      },
      orderBy: {
        _sum: {
          revenue: 'desc'
        }
      },
      take: limit
    });

    return {
      dimension,
      breakdown,
      summary: {
        totalValues: breakdown.length,
        topPerformers: breakdown.slice(0, 3)
      }
    };
  }

  /**
   * Get real-time analytics for the last hour
   */
  async getRealTimeAnalytics(organizationId: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const realtimeData = await prisma.performanceMetrics.findMany({
      where: {
        organizationId,
        date: {
          gte: oneHourAgo
        }
      },
      orderBy: { date: 'desc' },
      take: 100
    });

    const realtimeMetrics = this.calculateAggregatedMetrics(realtimeData);

    return {
      realtimeMetrics,
      lastUpdated: new Date(),
      dataPoints: realtimeData.length,
      timeRange: '1 hour'
    };
  }

  /**
   * Get revenue analytics with detailed breakdown
   */
  async getRevenueAnalytics(organizationId: string, startDate?: Date, endDate?: Date, source?: string) {
    const where: any = { organizationId };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    if (source) {
      where.source = source;
    }

    const revenueData = await prisma.revenueAnalytics.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    const revenueMetrics = this.calculateRevenueMetrics(revenueData);

    return {
      revenueData,
      metrics: revenueMetrics,
      summary: {
        profitMargin: revenueMetrics.totalRevenue > 0 ? (revenueMetrics.totalProfit / revenueMetrics.totalRevenue) * 100 : 0,
        costEfficiency: revenueMetrics.totalCost > 0 ? revenueMetrics.totalRevenue / revenueMetrics.totalCost : 0
      }
    };
  }

  /**
   * Get user analytics and behavior insights
   */
  async getUserAnalytics(organizationId: string, startDate?: Date, endDate?: Date, userId?: string) {
    const where: any = { organizationId };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    if (userId) {
      where.userId = userId;
    }

    const userData = await prisma.userAnalytics.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    const userMetrics = this.calculateUserMetrics(userData);

    return {
      userData,
      metrics: userMetrics,
      summary: {
        avgSessionDuration: userData.length > 0 ? userMetrics.totalSessions / userData.length : 0,
        avgPageViews: userData.length > 0 ? userMetrics.totalPageViews / userData.length : 0,
        conversionRate: userData.length > 0 ? (userMetrics.totalConversions / userData.length) * 100 : 0
      }
    };
  }

  /**
   * Create custom report
   */
  async createCustomReport(organizationId: string, name: string, description: string, query: any, schedule?: string) {
    return await prisma.customReport.create({
      data: {
        organizationId,
        name,
        description,
        query,
        schedule,
        createdAt: new Date()
      }
    });
  }

  /**
   * Get custom reports for an organization
   */
  async getCustomReports(organizationId: string) {
    return await prisma.customReport.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Execute custom report
   */
  async executeCustomReport(reportId: string, organizationId: string) {
    const report = await prisma.customReport.findFirst({
      where: { 
        id: reportId,
        organizationId 
      }
    });

    if (!report) {
      throw createError('Custom report not found', 404);
    }

    // Execute the custom query (this is a simplified version)
    // In production, you'd want to validate and sanitize the query
    let result;
    try {
      result = await prisma.$queryRawUnsafe(report.query as string);
    } catch (queryError) {
      throw createError('Invalid query execution', 400);
    }

    // Update last generated timestamp
    await prisma.customReport.update({
      where: { id: reportId },
      data: { lastGenerated: new Date() }
    });

    return {
      result,
      executedAt: new Date()
    };
  }

  /**
   * Get campaign analytics with performance metrics
   */
  async getCampaignAnalytics(filters: AnalyticsFilters, campaignFilters?: { type?: string; status?: string }) {
    const { organizationId, startDate, endDate, limit } = filters;
    
    // For now, return placeholder data since we don't have the campaign model in Prisma
    // In a real implementation, you would query the campaign table
    return [
      {
        id: 'campaign-1',
        name: 'Sample Campaign',
        type: 'DISPLAY',
        status: 'ACTIVE',
        performance: { impressions: 1000, clicks: 50, conversions: 5, revenue: 100, spend: 75, ctr: 5, cpc: 1.5, cpm: 75 },
        summary: { totalImpressions: 1000, totalClicks: 50, totalConversions: 5, totalRevenue: 100, totalSpend: 75, avgCTR: 5, avgCPC: 1.5, avgCPM: 75, conversionRate: 10, roas: 1.33 }
      }
    ];
  }

  /**
   * Compare multiple campaigns
   */
  async compareCampaigns(organizationId: string, campaignIds: string[]) {
    // For now, return placeholder data since we don't have the campaign model in Prisma
    // In a real implementation, you would query the campaign table
    const campaigns = campaignIds.map(id => ({
      id,
      name: `Campaign ${id}`,
      type: 'DISPLAY',
      status: 'ACTIVE',
      performance: { impressions: 1000, clicks: 50, conversions: 5, revenue: 100, spend: 75, ctr: 5, cpc: 1.5, cpm: 75 },
      summary: { totalImpressions: 1000, totalClicks: 50, totalConversions: 5, totalRevenue: 100, totalSpend: 75, avgCTR: 5, avgCPC: 1.5, avgCPM: 75, conversionRate: 10, roas: 1.33 }
    }));
    
    return {
      campaigns,
      comparison: this.generateCampaignComparison(campaigns)
    };
  }

  /**
   * Get campaign funnel analysis
   */
  async getCampaignFunnel(campaignId: string, organizationId: string, startDate?: Date, endDate?: Date) {
    const where: any = { 
      campaignId,
      organizationId 
    };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const metrics = await prisma.performanceMetrics.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    const funnel = {
      impressions: metrics.reduce((sum, m) => sum + m.impressions, 0),
      clicks: metrics.reduce((sum, m) => sum + m.clicks, 0),
      conversions: metrics.reduce((sum, m) => sum + m.conversions, 0)
    };

    return {
      funnel,
      rates: {
        ctr: funnel.impressions > 0 ? (funnel.clicks / funnel.impressions) * 100 : 0,
        conversionRate: funnel.clicks > 0 ? (funnel.conversions / funnel.clicks) * 100 : 0
      }
    };
  }

  /**
   * Get campaign geographic performance
   */
  async getCampaignGeographicPerformance(campaignId: string, organizationId: string, startDate?: Date, endDate?: Date) {
    // This would typically query geographic data from a separate table
    // For now, returning placeholder data
    return {
      campaignId,
      geographicData: [
        { country: 'US', impressions: 1000, clicks: 50, conversions: 5 },
        { country: 'CA', impressions: 500, clicks: 25, conversions: 2 },
        { country: 'UK', impressions: 300, clicks: 15, conversions: 1 }
      ]
    };
  }

  /**
   * Get campaign device performance
   */
  async getCampaignDevicePerformance(campaignId: string, organizationId: string, startDate?: Date, endDate?: Date) {
    // This would typically query device data from a separate table
    // For now, returning placeholder data
    return {
      campaignId,
      deviceData: [
        { device: 'Desktop', impressions: 800, clicks: 40, conversions: 4 },
        { device: 'Mobile', impressions: 600, clicks: 30, conversions: 3 },
        { device: 'Tablet', impressions: 200, clicks: 10, conversions: 1 }
      ]
    };
  }

  /**
   * Generate campaign comparison data
   */
  private generateCampaignComparison(campaigns: any[]) {
    if (campaigns.length < 2) {
      return { message: 'Need at least 2 campaigns to compare' };
    }

    const bestPerformer = campaigns.reduce((best, current) => 
      current.performance.revenue > best.performance.revenue ? current : best
    );

    const worstPerformer = campaigns.reduce((worst, current) => 
      current.performance.revenue < worst.performance.revenue ? current : worst
    );

    return {
      bestPerformer: {
        id: bestPerformer.id,
        name: bestPerformer.name,
        revenue: bestPerformer.performance.revenue,
        ctr: bestPerformer.performance.ctr
      },
      worstPerformer: {
        id: worstPerformer.id,
        name: worstPerformer.name,
        revenue: worstPerformer.performance.revenue,
        ctr: worstPerformer.performance.ctr
      },
      averageMetrics: {
        avgRevenue: campaigns.reduce((sum, c) => sum + c.performance.revenue, 0) / campaigns.length,
        avgCTR: campaigns.reduce((sum, c) => sum + c.performance.ctr, 0) / campaigns.length,
        avgConversionRate: campaigns.reduce((sum, c) => sum + c.summary.conversionRate, 0) / campaigns.length
      }
    };
  }

  // Private helper methods
  private async getHourlyData(where: any): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('hour', date) as period,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions,
        AVG(ctr) as avg_ctr,
        AVG(cpc) as avg_cpc,
        AVG(cpm) as avg_cpm,
        SUM(revenue) as total_revenue
      FROM performance_metrics 
      WHERE "organizationId" = ${where.organizationId}
        ${where.date ? `AND date >= ${where.date.gte}` : ''}
        ${where.date ? `AND date <= ${where.date.lte}` : ''}
        ${where.campaignId ? `AND "campaignId" = ${where.campaignId}` : ''}
        ${where.adId ? `AND "adId" = ${where.adId}` : ''}
      GROUP BY DATE_TRUNC('hour', date)
      ORDER BY period DESC
    `;
  }

  private async getWeeklyData(where: any): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('week', date) as period,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions,
        AVG(ctr) as avg_ctr,
        AVG(cpc) as avg_cpc,
        AVG(cpm) as avg_cpm,
        SUM(revenue) as total_revenue
      FROM performance_metrics 
      WHERE "organizationId" = ${where.organizationId}
        ${where.date ? `AND date >= ${where.date.gte}` : ''}
        ${where.date ? `AND date <= ${where.date.lte}` : ''}
        ${where.campaignId ? `AND "campaignId" = ${where.campaignId}` : ''}
        ${where.adId ? `AND "adId" = ${where.adId}` : ''}
      GROUP BY DATE_TRUNC('week', date)
      ORDER BY period DESC
    `;
  }

  private async getMonthlyData(where: any): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date) as period,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions,
        AVG(ctr) as avg_ctr,
        AVG(cpc) as avg_cpc,
        AVG(cpm) as avg_cpm,
        SUM(revenue) as total_revenue
      FROM performance_metrics 
      WHERE "organizationId" = ${where.organizationId}
        ${where.date ? `AND date >= ${where.date.gte}` : ''}
        ${where.date ? `AND date <= ${where.date.lte}` : ''}
        ${where.campaignId ? `AND "campaignId" = ${where.campaignId}` : ''}
        ${where.adId ? `AND "adId" = ${where.adId}` : ''}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY period DESC
    `;
  }

  private async getPeriodMetrics(organizationId: string, startDate: Date, endDate: Date) {
    const result = await prisma.performanceMetrics.aggregate({
      where: {
        organizationId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        impressions: true,
        clicks: true,
        conversions: true,
        revenue: true
      }
    });

    return {
      impressions: result._sum.impressions || 0,
      clicks: result._sum.clicks || 0,
      conversions: result._sum.conversions || 0,
      revenue: Number(result._sum.revenue || 0)
    };
  }

  private calculateAggregatedMetrics(data: any[]): PerformanceMetrics {
    return data.reduce((acc: any, item: any) => ({
      impressions: acc.impressions + (item.total_impressions || item.impressions || 0),
      clicks: acc.clicks + (item.total_clicks || item.clicks || 0),
      conversions: acc.conversions + (item.total_conversions || item.conversions || 0),
      revenue: acc.revenue + Number(item.total_revenue || item.revenue || 0),
      spend: acc.spend + Number(item.spend || 0),
      ctr: 0, // Will be calculated in summary
      cpc: 0, // Will be calculated in summary
      cpm: 0  // Will be calculated in summary
    }), { impressions: 0, clicks: 0, conversions: 0, revenue: 0, spend: 0, ctr: 0, cpc: 0, cpm: 0 });
  }

  private calculateSummaryMetrics(aggregated: PerformanceMetrics): AnalyticsSummary {
    return {
      totalImpressions: aggregated.impressions,
      totalClicks: aggregated.clicks,
      totalConversions: aggregated.conversions,
      totalRevenue: aggregated.revenue,
      totalSpend: aggregated.spend,
      avgCTR: aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions) * 100 : 0,
      avgCPC: aggregated.clicks > 0 ? aggregated.spend / aggregated.clicks : 0,
      avgCPM: aggregated.impressions > 0 ? (aggregated.spend / aggregated.impressions) * 1000 : 0,
      conversionRate: aggregated.clicks > 0 ? (aggregated.conversions / aggregated.clicks) * 100 : 0,
      roas: aggregated.spend > 0 ? aggregated.revenue / aggregated.spend : 0
    };
  }

  private calculateRevenueMetrics(data: any[]) {
    return data.reduce((acc, item) => ({
      totalRevenue: acc.totalRevenue + Number(item.revenue),
      totalCost: acc.totalCost + Number(item.cost),
      totalProfit: acc.totalProfit + Number(item.profit),
      avgROI: acc.avgROI + Number(item.roi)
    }), { totalRevenue: 0, totalCost: 0, totalProfit: 0, avgROI: 0 });
  }

  private calculateUserMetrics(data: any[]) {
    return data.reduce((acc, item) => ({
      totalSessions: acc.totalSessions + item.sessionDuration,
      totalPageViews: acc.totalPageViews + item.pageViews,
      totalConversions: acc.totalConversions + item.conversions,
      totalRevenue: acc.totalRevenue + Number(item.revenue)
    }), { totalSessions: 0, totalPageViews: 0, totalConversions: 0, totalRevenue: 0 });
  }

  private calculateChange(oldValue: number, newValue: number): { value: number; percentage: number } {
    const change = newValue - oldValue;
    const percentage = oldValue > 0 ? (change / oldValue) * 100 : 0;
    return { value: change, percentage };
  }

  private generateInsights(changes: any): string[] {
    const insights = [];
    
    if (changes.revenue.percentage > 10) {
      insights.push('Revenue has increased significantly');
    } else if (changes.revenue.percentage < -10) {
      insights.push('Revenue has decreased significantly');
    }
    
    if (changes.conversions.percentage > changes.clicks.percentage) {
      insights.push('Conversion rate is improving');
    }
    
    if (changes.impressions.percentage > 0 && changes.clicks.percentage > 0) {
      insights.push('Audience reach and engagement are growing');
    }
    
    return insights;
  }
} 