import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupPerformanceAnalyticsRoutes(app: Express, prefix: string): void {
  // Get comprehensive performance analytics
  app.get(`${prefix}/performance`, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, campaignId, adId, metric, groupBy = 'day' } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      if (campaignId) {
        where.campaignId = campaignId;
      }

      if (adId) {
        where.adId = adId;
      }

      let performanceData;
      if (groupBy === 'hour') {
        performanceData = await prisma.$queryRaw`
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
          WHERE "organizationId" = ${organizationId}
            ${startDate ? `AND date >= ${new Date(startDate as string)}` : ''}
            ${endDate ? `AND date <= ${new Date(endDate as string)}` : ''}
            ${campaignId ? `AND "campaignId" = ${campaignId}` : ''}
            ${adId ? `AND "adId" = ${adId}` : ''}
          GROUP BY DATE_TRUNC('hour', date)
          ORDER BY period DESC
        `;
      } else if (groupBy === 'week') {
        performanceData = await prisma.$queryRaw`
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
          WHERE "organizationId" = ${organizationId}
            ${startDate ? `AND date >= ${new Date(startDate as string)}` : ''}
            ${endDate ? `AND date <= ${new Date(endDate as string)}` : ''}
            ${campaignId ? `AND "campaignId" = ${campaignId}` : ''}
            ${adId ? `AND "adId" = ${adId}` : ''}
          GROUP BY DATE_TRUNC('week', date)
          ORDER BY period DESC
        `;
      } else {
        performanceData = await prisma.performanceMetrics.findMany({
          where,
          orderBy: { date: 'desc' }
        });
      }

      // Calculate aggregated metrics
      const aggregated = Array.isArray(performanceData) ? performanceData.reduce((acc: any, data: any) => ({
        totalImpressions: acc.totalImpressions + (data.total_impressions || data.impressions || 0),
        totalClicks: acc.totalClicks + (data.total_clicks || data.clicks || 0),
        totalConversions: acc.totalConversions + (data.total_conversions || data.conversions || 0),
        totalRevenue: acc.totalRevenue + Number(data.total_revenue || data.revenue || 0)
      }), { totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalRevenue: 0 }) : {};

      res.json({
        performanceData,
        aggregated,
        summary: {
          ctr: aggregated.totalImpressions > 0 ? (aggregated.totalClicks / aggregated.totalImpressions) * 100 : 0,
          conversionRate: aggregated.totalClicks > 0 ? (aggregated.totalConversions / aggregated.totalClicks) * 100 : 0,
          roas: aggregated.totalRevenue > 0 ? aggregated.totalRevenue / (aggregated.totalClicks * 2.5) : 0 // Assuming $2.50 CPC
        }
      });
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get performance comparison between periods
  app.get(`${prefix}/performance/comparison`, async (req: Request, res: Response) => {
    try {
      const { period1Start, period1End, period2Start, period2End, metric } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!period1Start || !period1End || !period2Start || !period2End) {
        throw createError('All period dates are required', 400);
      }

      // Get data for both periods
      const [period1Data, period2Data] = await Promise.all([
        prisma.performanceMetrics.aggregate({
          where: {
            organizationId,
            date: {
              gte: new Date(period1Start as string),
              lte: new Date(period1End as string)
            }
          },
          _sum: {
            impressions: true,
            clicks: true,
            conversions: true,
            revenue: true
          }
        }),
        prisma.performanceMetrics.aggregate({
          where: {
            organizationId,
            date: {
              gte: new Date(period2Start as string),
              lte: new Date(period2End as string)
            }
          },
          _sum: {
            impressions: true,
            clicks: true,
            conversions: true,
            revenue: true
          }
        })
      ]);

      // Calculate period-over-period changes
      const changes = {
        impressions: calculateChange(period1Data._sum.impressions || 0, period2Data._sum.impressions || 0),
        clicks: calculateChange(period1Data._sum.clicks || 0, period2Data._sum.clicks || 0),
        conversions: calculateChange(period1Data._sum.conversions || 0, period2Data._sum.conversions || 0),
        revenue: calculateChange(period1Data._sum.revenue || 0, period2Data._sum.revenue || 0)
      };

      res.json({
        period1: {
          start: period1Start,
          end: period1End,
          data: period1Data._sum
        },
        period2: {
          start: period2Start,
          end: period2End,
          data: period2Data._sum
        },
        changes,
        insights: generateInsights(changes)
      });
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get performance breakdown by dimensions
  app.get(`${prefix}/performance/breakdown`, async (req: Request, res: Response) => {
    try {
      const { dimension, startDate, endDate, limit = 10 } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!dimension) {
        throw createError('Dimension is required', 400);
      }

      const where: any = { organizationId };

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      // Get breakdown by dimension
      const breakdown = await prisma.performanceMetrics.groupBy({
        by: [dimension as string],
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
        take: Number(limit)
      });

      res.json({
        dimension,
        breakdown,
        summary: {
          totalValues: breakdown.length,
          topPerformers: breakdown.slice(0, 3)
        }
      });
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
}

// Helper functions
function calculateChange(oldValue: number, newValue: number): { value: number; percentage: number } {
  const change = newValue - oldValue;
  const percentage = oldValue > 0 ? (change / oldValue) * 100 : 0;
  return { value: change, percentage };
}

function generateInsights(changes: any): string[] {
  const insights = [];
  
  if (changes.revenue.percentage > 10) {
    insights.push('Revenue has increased significantly');
  } else if (changes.revenue.percentage < -10) {
    insights.push('Revenue has decreased significantly');
  }
  
  if (changes.conversions.percentage > changes.clicks.percentage) {
    insights.push('Conversion rate is improving');
  }
  
  return insights;
} 