import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupSiteRoutes(app: Express, prefix: string): void {
  // Get all sites for an organization
  app.get(`${prefix}/sites`, async (req: Request, res: Response) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      
      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const sites = await prisma.publisherSite.findMany({
        where: { organizationId },
        include: {
          adUnits: true,
          earnings: {
            orderBy: { date: 'desc' },
            take: 30
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ sites });
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Create new site
  app.post(`${prefix}/sites`, async (req: Request, res: Response) => {
    try {
      const { name, domain, settings } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!name || !domain) {
        throw createError('Name and domain are required', 400);
      }

      const site = await prisma.publisherSite.create({
        data: {
          organizationId,
          name,
          domain,
          status: 'PENDING',
          settings: settings || {}
        }
      });

      res.status(201).json({
        message: 'Site created successfully',
        site
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
 