import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupRetargetingRoutes(app: Express, prefix: string): void {
  // Get retargeting campaigns
  app.get(`${prefix}/retargeting/campaigns`, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, status, type } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { 
        organizationId,
        type: 'RETARGETING'
      };

      if (status) {
        where.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [campaigns, total] = await Promise.all([
        prisma.retargetingCampaign.findMany({
          where,
          include: {
            segments: true,
            ads: true,
            performance: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.retargetingCampaign.count({ where })
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

  // Create retargeting campaign
  app.post(`${prefix}/retargeting/campaigns`, async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        targetAudience,
        retargetingRules,
        frequencyCaps,
        bidStrategy,
        budget,
        startDate,
        endDate
      } = req.body;

      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!name || !targetAudience || !retargetingRules) {
        throw createError('Name, target audience, and retargeting rules are required', 400);
      }

      const campaign = await prisma.retargetingCampaign.create({
        data: {
          organizationId,
          name,
          description,
          targetAudience,
          retargetingRules,
          frequencyCaps: frequencyCaps || {},
          bidStrategy: bidStrategy || 'AUTO',
          budget,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          status: 'DRAFT',
          type: 'RETARGETING',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      res.status(201).json({
        message: 'Retargeting campaign created successfully',
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