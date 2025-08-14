import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupAdsRoutes(app: Express, prefix: string): void {
  // Get all ads for a campaign
  app.get(`${prefix}/campaigns/:campaignId/ads`, async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const ads = await prisma.advertiserAd.findMany({
        where: { 
          campaignId,
          organizationId 
        },
        include: {
          campaign: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ ads });
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
} 