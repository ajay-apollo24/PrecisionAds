import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

interface CustomError extends Error {
  statusCode?: number;
}

export function setupAudiencesRoutes(app: Express, prefix: string): void {
  // Get all audiences for a campaign
  app.get(`${prefix}/campaigns/:campaignId/audiences`, async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { 
        campaignId,
        organizationId 
      };

      const skip = (Number(page) - 1) * Number(limit);

      const [audiences, total] = await Promise.all([
        prisma.advertiserAudience.findMany({
          where,
          include: {
            campaign: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.advertiserAudience.count({ where })
      ]);

      res.json({
        audiences,
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

  // Get all audiences for an organization (across campaigns)
  app.get(`${prefix}/audiences`, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, campaignId } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

      if (campaignId) {
        where.campaignId = campaignId;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [audiences, total] = await Promise.all([
        prisma.advertiserAudience.findMany({
          where,
          include: {
            campaign: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.advertiserAudience.count({ where })
      ]);

      res.json({
        audiences,
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

  // Get single audience by ID
  app.get(`${prefix}/audiences/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const audience = await prisma.advertiserAudience.findFirst({
        where: { 
          id,
          organizationId 
        },
        include: {
          campaign: true
        }
      });

      if (!audience) {
        throw createError('Audience not found', 404);
      }

      res.json({ audience });
    } catch (error: unknown) {
      const customError = error as CustomError;
      if (customError.statusCode) {
        res.status(customError.statusCode).json({ error: customError.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Create new audience
  app.post(`${prefix}/campaigns/:campaignId/audiences`, async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const { name, description, targeting } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!name) {
        throw createError('Name is required', 400);
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

      // Calculate estimated audience size based on targeting
      let estimatedSize = null;
      if (targeting) {
        // This is a simplified calculation - in a real system, you'd use more sophisticated algorithms
        estimatedSize = Math.floor(Math.random() * 1000000) + 10000; // Random size between 10k-1M
      }

      const audience = await prisma.advertiserAudience.create({
        data: {
          organizationId,
          campaignId,
          name,
          description,
          targeting: targeting || {},
          size: estimatedSize
        }
      });

      res.status(201).json({
        message: 'Audience created successfully',
        audience
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

  // Update audience
  app.put(`${prefix}/audiences/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, targeting } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      // Check if audience exists and belongs to organization
      const existingAudience = await prisma.advertiserAudience.findFirst({
        where: { 
          id,
          organizationId 
        }
      });

      if (!existingAudience) {
        throw createError('Audience not found', 404);
      }

      // Recalculate estimated audience size if targeting changed
      let estimatedSize = existingAudience.size;
      if (targeting && JSON.stringify(targeting) !== JSON.stringify(existingAudience.targeting)) {
        estimatedSize = Math.floor(Math.random() * 1000000) + 10000;
      }

      const audience = await prisma.advertiserAudience.update({
        where: { id },
        data: {
          name,
          description,
          targeting,
          size: estimatedSize
        }
      });

      res.json({
        message: 'Audience updated successfully',
        audience
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

  // Delete audience
  app.delete(`${prefix}/audiences/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      // Check if audience exists and belongs to organization
      const existingAudience = await prisma.advertiserAudience.findFirst({
        where: { 
          id,
          organizationId 
        }
      });

      if (!existingAudience) {
        throw createError('Audience not found', 404);
      }

      // Hard delete audience (no soft delete needed for audiences)
      await prisma.advertiserAudience.delete({
        where: { id }
      });

      res.json({
        message: 'Audience deleted successfully'
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