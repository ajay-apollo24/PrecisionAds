import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupProgrammaticRoutes(app: Express, prefix: string): void {
  // Get programmatic deals
  app.get(`${prefix}/programmatic/deals`, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, type, status, publisher } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

      if (publisher) {
        where.publisherId = publisher;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [deals, total] = await Promise.all([
        prisma.programmaticDeal.findMany({
          where,
          include: {
            publisher: true,
            campaign: true,
            performance: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.programmaticDeal.count({ where })
      ]);

      res.json({
        deals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
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

  // Create programmatic deal
  app.post(`${prefix}/programmatic/deals`, async (req: Request, res: Response) => {
    try {
      const {
        name,
        type,
        publisherId,
        campaignId,
        dealTerms,
        targeting,
        budget,
        startDate,
        endDate
      } = req.body;

      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!name || !type || !publisherId || !dealTerms) {
        throw createError('Name, type, publisher ID, and deal terms are required', 400);
      }

      const deal = await prisma.programmaticDeal.create({
        data: {
          organizationId,
          name,
          type,
          publisherId,
          campaignId,
          dealTerms,
          targeting: targeting || {},
          budget,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          status: 'DRAFT',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      res.status(201).json({
        message: 'Programmatic deal created successfully',
        deal
      });
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get programmatic inventory
  app.get(`${prefix}/programmatic/inventory`, async (req: Request, res: Response) => {
    try {
      const { publisherId, adUnitType, geoLocation, startDate, endDate } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

      if (publisherId) {
        where.publisherId = publisherId;
      }

      if (adUnitType) {
        where.adUnitType = adUnitType;
      }

      if (geoLocation) {
        where.geoLocation = geoLocation;
      }

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      const inventory = await prisma.programmaticInventory.findMany({
        where,
        include: {
          publisher: true,
          adUnit: true,
          availability: true
        },
        orderBy: { date: 'desc' }
      });

      // Calculate inventory metrics
      const metrics = inventory.reduce((acc: any, inv: any) => ({
        totalImpressions: acc.totalImpressions + inv.availableImpressions,
        totalRevenue: acc.totalRevenue + Number(inv.estimatedRevenue),
        averageCPM: acc.averageCPM + Number(inv.estimatedCPM)
      }), { totalImpressions: 0, totalRevenue: 0, averageCPM: 0 });

      res.json({
        inventory,
        metrics: {
          ...metrics,
          averageCPM: metrics.averageCPM / inventory.length
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

  // Get programmatic performance
  app.get(`${prefix}/programmatic/performance`, async (req: Request, res: Response) => {
    try {
      const { dealId, startDate, endDate, publisherId } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { 
        organizationId,
        type: 'PROGRAMMATIC'
      };

      if (dealId) {
        where.dealId = dealId;
      }

      if (publisherId) {
        where.publisherId = publisherId;
      }

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      const performance = await prisma.programmaticPerformance.findMany({
        where,
        orderBy: { date: 'desc' }
      });

      // Calculate programmatic-specific metrics
      const metrics = performance.reduce((acc: any, perf: any) => ({
        totalImpressions: acc.totalImpressions + perf.impressions,
        totalClicks: acc.totalClicks + perf.clicks,
        totalConversions: acc.totalConversions + perf.conversions,
        totalSpend: acc.totalSpend + Number(perf.spend),
        totalRevenue: acc.totalRevenue + Number(perf.revenue)
      }), { totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalSpend: 0, totalRevenue: 0 });

      res.json({
        performance,
        metrics: {
          ...metrics,
          ctr: metrics.totalImpressions > 0 ? (metrics.totalClicks / metrics.totalImpressions) * 100 : 0,
          conversionRate: metrics.totalClicks > 0 ? (metrics.totalConversions / metrics.totalClicks) * 100 : 0,
          roas: metrics.totalSpend > 0 ? metrics.totalRevenue / metrics.totalSpend : 0,
          cpm: metrics.totalImpressions > 0 ? (metrics.totalSpend / metrics.totalImpressions) * 1000 : 0
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