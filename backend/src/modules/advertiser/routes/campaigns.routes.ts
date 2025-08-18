import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

interface CustomError extends Error {
  statusCode?: number;
}

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
    } catch (error: unknown) {
      const customError = error as CustomError;
      if (customError.statusCode) {
        res.status(customError.statusCode).json({ error: customError.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get single campaign by ID
  app.get(`${prefix}/campaigns/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const campaign = await prisma.advertiserCampaign.findFirst({
        where: { 
          id,
          organizationId 
        },
        include: {
          ads: true,
          audiences: true
        }
      });

      if (!campaign) {
        throw createError('Campaign not found', 404);
      }

      res.json({ campaign });
    } catch (error: unknown) {
      const customError = error as CustomError;
      if (customError.statusCode) {
        res.status(customError.statusCode).json({ error: customError.message });
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
    } catch (error: unknown) {
      const customError = error as CustomError;
      if (customError.statusCode) {
        res.status(customError.statusCode).json({ error: customError.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Update campaign
  app.put(`${prefix}/campaigns/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
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

      // Check if campaign exists and belongs to organization
      const existingCampaign = await prisma.advertiserCampaign.findFirst({
        where: { 
          id,
          organizationId 
        }
      });

      if (!existingCampaign) {
        throw createError('Campaign not found', 404);
      }

      const campaign = await prisma.advertiserCampaign.update({
        where: { id },
        data: {
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

      res.json({
        message: 'Campaign updated successfully',
        campaign
      });
    } catch (error: unknown) {
      const customError = error as CustomError;
      if (customError.statusCode) {
        res.status(customError.statusCode).json({ error: customError.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Update campaign status
  app.patch(`${prefix}/campaigns/:id/status`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!status) {
        throw createError('Status is required', 400);
      }

      // Check if campaign exists and belongs to organization
      const existingCampaign = await prisma.advertiserCampaign.findFirst({
        where: { 
          id,
          organizationId 
        }
      });

      if (!existingCampaign) {
        throw createError('Campaign not found', 404);
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        'DRAFT': ['ACTIVE', 'CANCELLED'],
        'ACTIVE': ['PAUSED', 'COMPLETED', 'CANCELLED'],
        'PAUSED': ['ACTIVE', 'COMPLETED', 'CANCELLED'],
        'COMPLETED': ['CANCELLED'],
        'CANCELLED': []
      };

      const currentStatus = existingCampaign.status;
      if (!validTransitions[currentStatus]?.includes(status)) {
        throw createError(`Invalid status transition from ${currentStatus} to ${status}`, 400);
      }

      const campaign = await prisma.advertiserCampaign.update({
        where: { id },
        data: { status }
      });

      res.json({
        message: 'Campaign status updated successfully',
        campaign
      });
    } catch (error: unknown) {
      const customError = error as CustomError;
      if (customError.statusCode) {
        res.status(customError.statusCode).json({ error: customError.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Delete campaign (soft delete by setting status to CANCELLED)
  app.delete(`${prefix}/campaigns/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      // Check if campaign exists and belongs to organization
      const existingCampaign = await prisma.advertiserCampaign.findFirst({
        where: { 
          id,
          organizationId 
        }
      });

      if (!existingCampaign) {
        throw createError('Campaign not found', 404);
      }

      // Soft delete by setting status to CANCELLED
      const campaign = await prisma.advertiserCampaign.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });

      res.json({
        message: 'Campaign deleted successfully',
        campaign
      });
    } catch (error: unknown) {
      const customError = error as CustomError;
      if (customError.statusCode) {
        res.status(customError.statusCode).json({ error: customError.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
} 