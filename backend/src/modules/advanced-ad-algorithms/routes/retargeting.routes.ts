import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';
import { RetargetingService } from '../services/retargeting.service';

const retargetingService = new RetargetingService();

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

      // Use the service to create the campaign
      const result = await retargetingService.createRetargetingCampaign(
        organizationId,
        {
          name,
          description,
          targetAudience,
          retargetingRules,
          frequencyCaps: frequencyCaps || {},
          bidStrategy: bidStrategy || 'AUTO',
          budget,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined
        }
      );

      res.status(201).json({
        message: 'Retargeting campaign created successfully',
        campaign: result
      });
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Process user event for retargeting
  app.post(`${prefix}/retargeting/events`, async (req: Request, res: Response) => {
    try {
      const { userId, event } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!userId || !event) {
        throw createError('User ID and event data are required', 400);
      }

      // Process the user event using the retargeting service
      const result = await retargetingService.processUserEvent(
        organizationId,
        userId,
        event
      );

      res.json({
        message: 'User event processed successfully',
        eligibleCampaigns: result.eligibleCampaigns.length,
        recommendations: result.recommendations.length,
        nextActions: result.nextActions
      });
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get retargeting recommendations for a user
  app.get(`${prefix}/retargeting/recommendations/:userId`, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { context } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      // Get recommendations using the retargeting service
      const result = await retargetingService.getRetargetingRecommendations(
        userId,
        organizationId,
        context ? JSON.parse(context as string) : {}
      );

      res.json({
        message: 'Retargeting recommendations retrieved successfully',
        ...result
      });
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Optimize retargeting campaigns
  app.post(`${prefix}/retargeting/optimize`, async (req: Request, res: Response) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      // Optimize campaigns using the retargeting service
      const result = await retargetingService.optimizeDeals(organizationId);

      res.json({
        message: 'Retargeting campaigns optimized successfully',
        ...result
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