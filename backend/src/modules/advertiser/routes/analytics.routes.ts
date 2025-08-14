import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupAnalyticsRoutes(app: Express, prefix: string): void {
  // Get campaign analytics
  app.get(`${prefix}/campaigns/:campaignId/analytics`, async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const { startDate, endDate } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const campaign = await prisma.advertiserCampaign.findFirst({
        where: { 
          id: campaignId,
          organizationId 
        },
        include: {
          ads: true
        }
      });

      if (!campaign) {
        throw createError('Campaign not found', 404);
      }

      // Get ad performance data
      const adPerformance = await prisma.advertiserAd.findMany({
        where: { 
          campaignId,
          organizationId 
        },
        select: {
          id: true,
          name: true,
          impressions: true,
          clicks: true,
          conversions: true,
          ctr: true,
          cpc: true,
          cpm: true
        }
      });

      // Calculate campaign totals
      const totals = adPerformance.reduce((acc, ad) => ({
        impressions: acc.impressions + ad.impressions,
        clicks: acc.clicks + ad.clicks,
        conversions: acc.conversions + ad.conversions
      }), { impressions: 0, clicks: 0, conversions: 0 });

      const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

      res.json({
        campaign,
        adPerformance,
        summary: {
          ...totals,
          ctr,
          totalSpent: campaign.totalSpent
        }
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