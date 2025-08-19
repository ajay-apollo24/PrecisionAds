import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupSiteRoutes(app: Express, prefix: string): void {
  // Get all sites for an organization
  app.get(`${prefix}/sites`, async (req: Request, res: Response) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      
      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const sites = await prisma.publisherSite.findMany({
        where: { organizationId },
        include: {
          adUnits: true,
          earnings: {
            orderBy: { date: 'desc' },
            take: 30
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ sites });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Create new site
  app.post(`${prefix}/sites`, async (req: Request, res: Response) => {
    try {
      const { name, domain, settings } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!name || !domain) {
        throw createError('Name and domain are required', 400);
      }

      const site = await prisma.publisherSite.create({
        data: {
          organizationId,
          name,
          domain,
          status: 'PENDING',
          settings: settings || {}
        }
      });

      res.status(201).json({
        message: 'Site created successfully',
        site
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Delete site
  app.delete(`${prefix}/sites/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const site = await prisma.publisherSite.findFirst({
        where: { id, organizationId }
      });

      if (!site) {
        throw createError('Site not found', 404);
      }

      await prisma.publisherSite.delete({
        where: { id }
      });

      res.json({
        message: 'Site deleted successfully'
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get site statistics
  app.get(`${prefix}/sites/:id/stats`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const site = await prisma.publisherSite.findFirst({
        where: { id, organizationId }
      });

      if (!site) {
        throw createError('Site not found', 404);
      }

      const where: any = { 
        siteId: id,
        organizationId 
      };

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
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
        prisma.adUnit.count({ where: { siteId: id, organizationId, status: 'ACTIVE' } }),
        prisma.adRequest.count({ where: { siteId: id, organizationId } })
      ]);

      const stats = {
        totalImpressions: earnings._sum.impressions || 0,
        totalClicks: earnings._sum.clicks || 0,
        totalRevenue: earnings._sum.revenue || 0,
        activeAdUnits: adUnits,
        totalAdRequests: adRequests,
        ctr: earnings._sum.impressions && earnings._sum.impressions > 0 
          ? (earnings._sum.clicks || 0) / earnings._sum.impressions * 100 
          : 0
      };

      res.json({ stats });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
} 
 