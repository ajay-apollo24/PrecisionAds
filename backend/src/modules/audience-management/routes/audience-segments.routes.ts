import { Express, Request, Response } from 'express';
import { AudienceService } from '../services/audience.service';
import { createError } from '../../../shared/middleware/error-handler';

const audienceService = new AudienceService();

export function setupAudienceSegmentsRoutes(app: Express, prefix: string): void {
  // Get all audience segments for an organization
  app.get(`${prefix}/segments`, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, type, status } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const filters = {
        organizationId,
        type: type as string,
        status: status as string,
        page: Number(page),
        limit: Number(limit)
      };

      const result = await audienceService.getAudienceSegments(filters);

      res.json(result);
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Create new audience segment
  app.post(`${prefix}/segments`, async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        type,
        targetingRules,
        estimatedSize,
        status = 'DRAFT'
      } = req.body;

      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!name || !type) {
        throw createError('Name and type are required', 400);
      }

      const segment = await audienceService.createAudienceSegment(
        organizationId,
        name,
        description,
        type,
        targetingRules,
        estimatedSize,
        status
      );

      res.status(201).json({
        message: 'Audience segment created successfully',
        segment
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Update audience segment
  app.put(`${prefix}/segments/:id`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const updatedSegment = await audienceService.updateAudienceSegment(
        id,
        organizationId,
        updateData
      );

      res.json({
        message: 'Audience segment updated successfully',
        segment: updatedSegment
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get segment performance metrics
  app.get(`${prefix}/segments/:id/performance`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const result = await audienceService.getSegmentPerformance(
        id,
        organizationId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(result);
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
} 