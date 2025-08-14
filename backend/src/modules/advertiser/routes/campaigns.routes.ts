import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupCampaignRoutes(app: Express, prefix: string): void {
  // Get all campaigns for an organization
  app.get(`${prefix}/campaigns`, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, status, type } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

      if (status) {
        where.status = status;
      }

      if (type) {
        where.type = type;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [campaigns, total] = await Promise.all([
        prisma.advertiserCampaign.findMany({
          where,
          include: {
            ads: true,
            audiences: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.advertiserCampaign.count({ where })
      ]);

      res.json({
        campaigns,
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

  // Create new campaign
  app.post(`${prefix}/campaigns`, async (req: Request, res: Response) => {
    try {
      const {
        name,
        type,
        startDate,
        endDate,
        budget,
        budgetType,
        bidStrategy,
        targetCPM,
        targetCPC,
        targetCPA,
        dailyBudget
      } = req.body;

      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!name || !type || !budget || !budgetType || !bidStrategy) {
        throw createError('Missing required fields', 400);
      }

      const campaign = await prisma.advertiserCampaign.create({
        data: {
          organizationId,
          name,
          type,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          budget,
          budgetType,
          bidStrategy,
          targetCPM,
          targetCPC,
          targetCPA,
          dailyBudget
        }
      });

      res.status(201).json({
        message: 'Campaign created successfully',
        campaign
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