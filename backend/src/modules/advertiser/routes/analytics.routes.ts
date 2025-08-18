import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

interface CustomError extends Error {
  statusCode?: number;
}

export function setupAnalyticsRoutes(app: Express, prefix: string): void {
  // Get organization-wide analytics summary
  app.get(`${prefix}/analytics/summary`, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      // Get all campaigns for the organization
      const campaigns = await prisma.advertiserCampaign.findMany({
        where,
        include: {
          ads: true
        }
      });

      // Calculate organization-wide metrics
      const totalCampaigns = campaigns.length;
      const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
      const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budget), 0);
      const totalSpent = campaigns.reduce((sum, c) => sum + Number(c.totalSpent), 0);
      const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
      const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
      const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

      // Calculate overall performance metrics
      const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const overallConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const overallCPM = totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0;
      const overallCPC = totalClicks > 0 ? totalSpent / totalClicks : 0;
      const overallCPA = totalConversions > 0 ? totalSpent / totalConversions : 0;

      // Get top performing campaigns
      const topCampaigns = campaigns
        .filter(c => c.status === 'ACTIVE')
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: c.name,
          clicks: c.clicks,
          impressions: c.impressions,
          ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
          spent: Number(c.totalSpent)
        }));

      res.json({
        summary: {
          totalCampaigns,
          activeCampaigns,
          totalBudget,
          totalSpent,
          totalImpressions,
          totalClicks,
          totalConversions,
          overallCTR,
          overallConversionRate,
          overallCPM,
          overallCPC,
          overallCPA
        },
        topCampaigns,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null
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
      const conversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
      const cpm = totals.impressions > 0 ? (Number(campaign.totalSpent) / totals.impressions) * 1000 : 0;
      const cpc = totals.clicks > 0 ? Number(campaign.totalSpent) / totals.clicks : 0;
      const cpa = totals.conversions > 0 ? Number(campaign.totalSpent) / totals.conversions : 0;

      // Calculate budget utilization
      const budgetUtilization = (Number(campaign.totalSpent) / Number(campaign.budget)) * 100;

      // Get daily performance data (simplified - in real system you'd have actual daily data)
      const dailyData = [];
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dailyData.push({
          date: d.toISOString().split('T')[0],
          impressions: Math.floor(Math.random() * 1000) + 100,
          clicks: Math.floor(Math.random() * 100) + 10,
          conversions: Math.floor(Math.random() * 10) + 1
        });
      }

      res.json({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          budget: campaign.budget,
          totalSpent: campaign.totalSpent,
          budgetUtilization
        },
        performance: {
          ...totals,
          ctr,
          conversionRate,
          cpm,
          cpc,
          cpa
        },
        adPerformance,
        dailyData,
        dateRange: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
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

  // Get individual ad performance
  app.get(`${prefix}/ads/:adId/analytics`, async (req: Request, res: Response) => {
    try {
      const { adId } = req.params;
      const { startDate, endDate } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const ad = await prisma.advertiserAd.findFirst({
        where: { 
          id: adId,
          organizationId 
        },
        include: {
          campaign: true
        }
      });

      if (!ad) {
        throw createError('Ad not found', 404);
      }

      // Calculate ad performance metrics
      const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
      const conversionRate = ad.clicks > 0 ? (ad.conversions / ad.clicks) * 100 : 0;
      const cpm = ad.impressions > 0 ? (Number(ad.cpm)) : 0;
      const cpc = ad.clicks > 0 ? Number(ad.cpc) : 0;

      // Get hourly performance data (simplified)
      const hourlyData = [];
      for (let hour = 0; hour < 24; hour++) {
        hourlyData.push({
          hour,
          impressions: Math.floor(Math.random() * 100) + 10,
          clicks: Math.floor(Math.random() * 10) + 1,
          conversions: Math.floor(Math.random() * 2)
        });
      }

      res.json({
        ad: {
          id: ad.id,
          name: ad.name,
          status: ad.status,
          creativeType: ad.creativeType,
          campaign: {
            id: ad.campaign.id,
            name: ad.campaign.name
          }
        },
        performance: {
          impressions: ad.impressions,
          clicks: ad.clicks,
          conversions: ad.conversions,
          ctr,
          conversionRate,
          cpm,
          cpc
        },
        hourlyData,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null
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
} 