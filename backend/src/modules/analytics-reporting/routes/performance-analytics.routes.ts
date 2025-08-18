import { Express, Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { createError } from '../../../shared/middleware/error-handler';

const analyticsService = new AnalyticsService();

export function setupPerformanceAnalyticsRoutes(app: Express, prefix: string): void {
  // Get comprehensive performance analytics
  app.get(`${prefix}/performance`, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, campaignId, adId, metric, groupBy = 'day' } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const filters = {
        organizationId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        campaignId: campaignId as string,
        adId: adId as string,
        groupBy: groupBy as 'hour' | 'day' | 'week' | 'month'
      };

      const result = await analyticsService.getPerformanceAnalytics(filters);

      res.json(result);
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get performance comparison between periods
  app.get(`${prefix}/performance/comparison`, async (req: Request, res: Response) => {
    try {
      const { period1Start, period1End, period2Start, period2End, metric } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!period1Start || !period1End || !period2Start || !period2End) {
        throw createError('All period dates are required', 400);
      }

      const result = await analyticsService.getPerformanceComparison(
        organizationId,
        new Date(period1Start as string),
        new Date(period1End as string),
        new Date(period2Start as string),
        new Date(period2End as string)
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

  // Get performance breakdown by dimensions
  app.get(`${prefix}/performance/breakdown`, async (req: Request, res: Response) => {
    try {
      const { dimension, startDate, endDate, limit = 10 } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!dimension) {
        throw createError('Dimension is required', 400);
      }

      const filters = {
        organizationId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: Number(limit)
      };

      const result = await analyticsService.getPerformanceBreakdown(
        organizationId,
        dimension as string,
        filters
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

  // Get real-time analytics
  app.get(`${prefix}/realtime`, async (req: Request, res: Response) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const result = await analyticsService.getRealTimeAnalytics(organizationId);

      res.json(result);
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get revenue analytics
  app.get(`${prefix}/revenue`, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, source } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const result = await analyticsService.getRevenueAnalytics(
        organizationId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        source as string
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

  // Get user analytics
  app.get(`${prefix}/users`, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, userId } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const result = await analyticsService.getUserAnalytics(
        organizationId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        userId as string
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

  // Create custom report
  app.post(`${prefix}/custom-reports`, async (req: Request, res: Response) => {
    try {
      const { name, description, query, schedule } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!name || !query) {
        throw createError('Name and query are required', 400);
      }

      const report = await analyticsService.createCustomReport(
        organizationId,
        name,
        description,
        query,
        schedule
      );

      res.status(201).json({
        message: 'Custom report created successfully',
        report
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get custom reports
  app.get(`${prefix}/custom-reports`, async (req: Request, res: Response) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const reports = await analyticsService.getCustomReports(organizationId);

      res.json({ reports });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Execute custom report
  app.post(`${prefix}/custom-reports/:id/execute`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const result = await analyticsService.executeCustomReport(id, organizationId);

      res.json({
        message: 'Custom report executed successfully',
        ...result
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