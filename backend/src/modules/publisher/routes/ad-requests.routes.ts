import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupAdRequestRoutes(app: Express, prefix: string): void {
  // Get ad requests for a site
  app.get(`${prefix}/sites/:siteId/ad-requests`, async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { page = 1, limit = 50, status } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = {
        siteId,
        organizationId
      };

      if (status) {
        where.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [adRequests, total] = await Promise.all([
        prisma.adRequest.findMany({
          where,
          include: {
            adUnit: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.adRequest.count({ where })
      ]);

      res.json({
        adRequests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get ad request statistics
  app.get(`${prefix}/sites/:siteId/ad-requests/stats`, async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { startDate, endDate } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = {
        siteId,
        organizationId
      };

      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      const stats = await prisma.adRequest.groupBy({
        by: ['status'],
        where,
        _count: {
          status: true
        }
      });

      const totalRequests = await prisma.adRequest.count({ where });
      const totalImpressions = await prisma.adRequest.count({
        where: { ...where, impression: true }
      });
      const totalClicks = await prisma.adRequest.count({
        where: { ...where, clickThrough: true }
      });

      res.json({
        stats,
        summary: {
          totalRequests,
          totalImpressions,
          totalClicks,
          ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
        }
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
} 