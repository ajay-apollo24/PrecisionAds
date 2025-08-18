import { Express, Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { createError } from '../../../shared/middleware/error-handler';

const analyticsService = new AnalyticsService();

export function setupCampaignAnalyticsRoutes(app: Express, prefix: string): void {
  // Get campaign performance analytics
  app.get(`${prefix}/campaigns`, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, campaignType, status, limit = 50 } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const filters = {
        organizationId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: Number(limit)
      };

      // Get campaign data with performance metrics
      const campaigns = await analyticsService.getCampaignAnalytics(filters, {
        type: campaignType as string,
        status: status as string
      });

      res.json({
        campaigns,
        summary: {
          totalCampaigns: campaigns.length,
          activeCampaigns: campaigns.filter((c: any) => c.status === 'ACTIVE').length,
          totalSpend: campaigns.reduce((sum: number, c: any) => sum + Number(c.totalSpend || 0), 0),
          totalRevenue: campaigns.reduce((sum: number, c: any) => sum + Number(c.totalRevenue || 0), 0)
        }
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get campaign performance comparison
  app.get(`${prefix}/campaigns/compare`, async (req: Request, res: Response) => {
    try {
      const { campaignIds } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!campaignIds) {
        throw createError('Campaign IDs required', 400);
      }

      const campaignIdArray = (campaignIds as string).split(',');
      
      const comparison = await analyticsService.compareCampaigns(organizationId, campaignIdArray);

      res.json(comparison);
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get campaign funnel analysis
  app.get(`${prefix}/campaigns/:id/funnel`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const funnel = await analyticsService.getCampaignFunnel(
        id,
        organizationId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(funnel);
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get campaign geographic performance
  app.get(`${prefix}/campaigns/:id/geographic`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const geographic = await analyticsService.getCampaignGeographicPerformance(
        id,
        organizationId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(geographic);
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get campaign device performance
  app.get(`${prefix}/campaigns/:id/devices`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const devices = await analyticsService.getCampaignDevicePerformance(
        id,
        organizationId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(devices);
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
} 