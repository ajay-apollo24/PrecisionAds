import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupAudiencesRoutes(app: Express, prefix: string): void {
  // Get all audiences for a campaign
  app.get(`${prefix}/campaigns/:campaignId/audiences`, async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const audiences = await prisma.advertiserAudience.findMany({
        where: { 
          campaignId,
          organizationId 
        },
        include: {
          campaign: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ audiences });
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
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

      const audience = await prisma.advertiserAudience.create({
        data: {
          organizationId,
          campaignId,
          name,
          description,
          targeting: targeting || {}
        }
      });

      res.status(201).json({
        message: 'Audience created successfully',
        audience
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