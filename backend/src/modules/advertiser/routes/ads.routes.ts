import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

interface CustomError extends Error {
  statusCode?: number;
}

export function setupAdsRoutes(app: Express, prefix: string): void {
  // Get all ads for a campaign
  app.get(`${prefix}/campaigns/:campaignId/ads`, async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const { page = 1, limit = 50, status, creativeType } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { 
        campaignId,
        organizationId 
      };

      if (status) {
        where.status = status;
      }

      if (creativeType) {
        where.creativeType = creativeType;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [ads, total] = await Promise.all([
        prisma.advertiserAd.findMany({
          where,
          include: {
            campaign: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.advertiserAd.count({ where })
      ]);

      res.json({
        ads,
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

  // Get all ads for an organization (across campaigns)
  app.get(`${prefix}/ads`, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, status, creativeType, campaignId } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

      if (status) {
        where.status = status;
      }

      if (creativeType) {
        where.creativeType = creativeType;
      }

      if (campaignId) {
        where.campaignId = campaignId;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [ads, total] = await Promise.all([
        prisma.advertiserAd.findMany({
          where,
          include: {
            campaign: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.advertiserAd.count({ where })
      ]);

      res.json({
        ads,
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

  // Get single ad by ID
  app.get(`${prefix}/ads/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const ad = await prisma.advertiserAd.findFirst({
        where: { 
          id,
          organizationId 
        },
        include: {
          campaign: true
        }
      });

      if (!ad) {
        throw createError('Ad not found', 404);
      }

      res.json({ ad });
    } catch (error: unknown) {
      const customError = error as CustomError;
      if (customError.statusCode) {
        res.status(customError.statusCode).json({ error: customError.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Create new ad
  app.post(`${prefix}/campaigns/:campaignId/ads`, async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const { name, creativeType, creativeUrl, landingPageUrl, weight, targeting } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!name || !creativeType || !creativeUrl || !landingPageUrl) {
        throw createError('Missing required fields', 400);
      }

      // Validate campaign exists and belongs to organization
      const campaign = await prisma.advertiserCampaign.findFirst({
        where: { 
          id: campaignId,
          organizationId 
        }
      });

      if (!campaign) {
        throw createError('Campaign not found', 404);
      }

      const ad = await prisma.advertiserAd.create({
        data: {
          organizationId,
          campaignId,
          name,
          creativeType,
          creativeUrl,
          landingPageUrl,
          weight: weight || 100,
          targeting: targeting || {}
        }
      });

      res.status(201).json({
        message: 'Ad created successfully',
        ad
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

  // Update ad
  app.put(`${prefix}/ads/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, creativeType, creativeUrl, landingPageUrl, weight, targeting } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      // Check if ad exists and belongs to organization
      const existingAd = await prisma.advertiserAd.findFirst({
        where: { 
          id,
          organizationId 
        }
      });

      if (!existingAd) {
        throw createError('Ad not found', 404);
      }

      const ad = await prisma.advertiserAd.update({
        where: { id },
        data: {
          name,
          creativeType,
          creativeUrl,
          landingPageUrl,
          weight,
          targeting
        }
      });

      res.json({
        message: 'Ad updated successfully',
        ad
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

  // Update ad status
  app.patch(`${prefix}/ads/:id/status`, async (req: Request, res: Response) => {
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

      // Check if ad exists and belongs to organization
      const existingAd = await prisma.advertiserAd.findFirst({
        where: { 
          id,
          organizationId 
        }
      });

      if (!existingAd) {
        throw createError('Ad not found', 404);
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        'DRAFT': ['APPROVED', 'REJECTED'],
        'APPROVED': ['ACTIVE', 'REJECTED'],
        'ACTIVE': ['PAUSED', 'REJECTED'],
        'PAUSED': ['ACTIVE', 'REJECTED'],
        'REJECTED': ['DRAFT'],
        'CANCELLED': []
      };

      const currentStatus = existingAd.status;
      if (!validTransitions[currentStatus]?.includes(status)) {
        throw createError(`Invalid status transition from ${currentStatus} to ${status}`, 400);
      }

      const ad = await prisma.advertiserAd.update({
        where: { id },
        data: { status }
      });

      res.json({
        message: 'Ad status updated successfully',
        ad
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

  // Delete ad (soft delete by setting status to CANCELLED)
  app.delete(`${prefix}/ads/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      // Check if ad exists and belongs to organization
      const existingAd = await prisma.advertiserAd.findFirst({
        where: { 
          id,
          organizationId 
        }
      });

      if (!existingAd) {
        throw createError('Ad not found', 404);
      }

      // Soft delete by setting status to REJECTED
      const ad = await prisma.advertiserAd.update({
        where: { id },
        data: { status: 'REJECTED' }
      });

      res.json({
        message: 'Ad deleted successfully',
        ad
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