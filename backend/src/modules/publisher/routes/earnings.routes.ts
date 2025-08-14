import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupEarningsRoutes(app: Express, prefix: string): void {
  // Get earnings for a site
  app.get(`${prefix}/sites/:siteId/earnings`, async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { startDate, endDate, groupBy = 'day' } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = {
        siteId,
        organizationId
      };

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      let earnings;
      if (groupBy === 'month') {
        earnings = await prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', date) as period,
            SUM(impressions) as total_impressions,
            SUM(clicks) as total_clicks,
            SUM(revenue) as total_revenue,
            AVG(cpm) as avg_cpm,
            AVG(cpc) as avg_cpc
          FROM publisher_earnings 
          WHERE "siteId" = ${siteId} 
            AND "organizationId" = ${organizationId}
            ${startDate ? `AND date >= ${new Date(startDate as string)}` : ''}
            ${endDate ? `AND date <= ${new Date(endDate as string)}` : ''}
          GROUP BY DATE_TRUNC('month', date)
          ORDER BY period DESC
        `;
      } else {
        earnings = await prisma.publisherEarning.findMany({
          where,
          orderBy: { date: 'desc' }
        });
      }

      // Calculate totals
      const totals = await prisma.publisherEarning.aggregate({
        where,
        _sum: {
          impressions: true,
          clicks: true,
          revenue: true
        },
        _avg: {
          cpm: true,
          cpc: true
        }
      });

      res.json({
        earnings,
        totals: {
          totalImpressions: totals._sum.impressions || 0,
          totalClicks: totals._sum.clicks || 0,
          totalRevenue: totals._sum.revenue || 0,
          averageCPM: totals._avg.cpm || 0,
          averageCPC: totals._avg.cpc || 0
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

  // Get earnings summary for organization
  app.get(`${prefix}/earnings/summary`, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
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

      const summary = await prisma.publisherEarning.aggregate({
        where,
        _sum: {
          impressions: true,
          clicks: true,
          revenue: true
        },
        _avg: {
          cpm: true,
          cpc: true
        }
      });

      // Get top performing sites
      const topSites = await prisma.publisherEarning.groupBy({
        by: ['siteId'],
        where,
        _sum: {
          revenue: true,
          impressions: true,
          clicks: true
        },
        orderBy: {
          _sum: {
            revenue: 'desc'
          }
        },
        take: 5
      });

      res.json({
        summary: {
          totalImpressions: summary._sum.impressions || 0,
          totalClicks: summary._sum.clicks || 0,
          totalRevenue: summary._sum.revenue || 0,
          averageCPM: summary._avg.cpm || 0,
          averageCPC: summary._avg.cpc || 0
        },
        topSites
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