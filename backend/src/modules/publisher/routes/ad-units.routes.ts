import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupAdUnitRoutes(app: Express, prefix: string): void {
  // Get all ad units for a site
  app.get(`${prefix}/sites/:siteId/ad-units`, async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const adUnits = await prisma.adUnit.findMany({
        where: { 
          siteId,
          organizationId 
        },
        include: {
          site: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ adUnits });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Create new ad unit
  app.post(`${prefix}/sites/:siteId/ad-units`, async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { name, size, format, settings } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!name || !size || !format) {
        throw createError('Name, size, and format are required', 400);
      }

      const adUnit = await prisma.adUnit.create({
        data: {
          organizationId,
          siteId,
          name,
          size,
          format,
          status: 'INACTIVE',
          settings: settings || {}
        }
      });

      res.status(201).json({
        message: 'Ad unit created successfully',
        adUnit
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Update ad unit
  app.put(`${prefix}/ad-units/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, size, format, status, settings } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const adUnit = await prisma.adUnit.findFirst({
        where: { 
          id,
          organizationId 
        }
      });

      if (!adUnit) {
        throw createError('Ad unit not found', 404);
      }

      const updatedAdUnit = await prisma.adUnit.update({
        where: { id },
        data: {
          name,
          size,
          format,
          status,
          settings,
          updatedAt: new Date()
        }
      });

      res.json({
        message: 'Ad unit updated successfully',
        adUnit: updatedAdUnit
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Delete ad unit
  app.delete(`${prefix}/ad-units/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const adUnit = await prisma.adUnit.findFirst({
        where: { id, organizationId }
      });

      if (!adUnit) {
        throw createError('Ad unit not found', 404);
      }

      await prisma.adUnit.delete({
        where: { id }
      });

      res.json({
        message: 'Ad unit deleted successfully'
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
} 