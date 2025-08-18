import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupAdServingRoutes(app: Express, prefix: string): void {
  // Ad request endpoint - this is the main ad serving endpoint
  app.post(`${prefix}/request`, async (req: Request, res: Response) => {
    try {
      const {
        siteId,
        adUnitId,
        requestId,
        userAgent,
        ipAddress,
        geoLocation,
        deviceInfo,
        targeting
      } = req.body;

      if (!siteId || !adUnitId || !requestId) {
        throw createError('Missing required fields: siteId, adUnitId, requestId', 400);
      }

      // Get site and ad unit info
      const site = await prisma.publisherSite.findUnique({
        where: { id: siteId },
        include: { organization: true }
      });

      if (!site) {
        throw createError('Site not found', 404);
      }

      const adUnit = await prisma.adUnit.findUnique({
        where: { id: adUnitId }
      });

      if (!adUnit) {
        throw createError('Ad unit not found', 404);
      }

      // Create ad request record
      const adRequest = await prisma.adRequest.create({
        data: {
          organizationId: site.organizationId,
          siteId,
          adUnitId,
          requestId,
          userAgent,
          ipAddress,
          geoLocation,
          deviceInfo,
          targeting,
          status: 'PENDING'
        }
      });

      // Find eligible ads for this request
      const eligibleAds = await prisma.advertiserAd.findMany({
        where: {
          status: 'ACTIVE',
          campaign: {
            status: 'ACTIVE',
            organization: {
              orgType: 'ADVERTISER'
            }
          }
        },
        include: {
          campaign: true
        }
      });

      // Simple ad selection logic (can be enhanced with bidding)
      let selectedAd = null;
      if (eligibleAds.length > 0) {
        // For now, just select a random ad
        selectedAd = eligibleAds[Math.floor(Math.random() * eligibleAds.length)];
        
        // Update ad request with selected ad
        await prisma.adRequest.update({
          where: { id: adRequest.id },
          data: {
            servedAdId: selectedAd.id,
            status: 'SERVED',
            impression: true
          }
        });

        // Update ad metrics
        await prisma.advertiserAd.update({
          where: { id: selectedAd.id },
          data: {
            impressions: { increment: 1 }
          }
        });
      } else {
        // No ads available
        await prisma.adRequest.update({
          where: { id: adRequest.id },
          data: { status: 'FAILED' }
        });
      }

      res.json({
        requestId,
        ad: selectedAd ? {
          id: selectedAd.id,
          creativeUrl: selectedAd.creativeUrl,
          landingPageUrl: selectedAd.landingPageUrl,
          creativeType: selectedAd.creativeType
        } : null,
        status: selectedAd ? 'SERVED' : 'NO_AD_AVAILABLE'
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Ad impression tracking
  app.post(`${prefix}/impression`, async (req: Request, res: Response) => {
    try {
      const { requestId, adRequestId } = req.body;
      const id = requestId || adRequestId;

      if (!id) {
        throw createError('Request ID or Ad Request ID required', 400);
      }

      const adRequest = await prisma.adRequest.findUnique({
        where: { requestId: id }
      });

      if (!adRequest) {
        throw createError('Ad request not found', 404);
      }

      // Update impression status
      await prisma.adRequest.update({
        where: { id: adRequest.id },
        data: { impression: true }
      });

      res.json({ success: true, message: 'Impression tracked successfully' });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Ad click tracking
  app.post(`${prefix}/click`, async (req: Request, res: Response) => {
    try {
      const { requestId, adRequestId } = req.body;
      const id = requestId || adRequestId;

      if (!id) {
        throw createError('Request ID or Ad Request ID required', 400);
      }

      const adRequest = await prisma.adRequest.findUnique({
        where: { requestId: id },
        include: { adUnit: true }
      });

      if (!adRequest) {
        throw createError('Ad request not found', 404);
      }

      // Update click status
      await prisma.adRequest.update({
        where: { id: adRequest.id },
        data: { clickThrough: true }
      });

      // Update ad metrics if ad was served
      if (adRequest.servedAdId) {
        await prisma.advertiserAd.update({
          where: { id: adRequest.servedAdId },
          data: {
            clicks: { increment: 1 }
          }
        });
      }

      res.json({ success: true, message: 'Click tracked successfully' });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Ad conversion tracking
  app.post(`${prefix}/conversion`, async (req: Request, res: Response) => {
    try {
      const { requestId, adRequestId, conversionType, conversionValue, timestamp } = req.body;
      const id = requestId || adRequestId;

      if (!id || !conversionType) {
        throw createError('Request ID (or Ad Request ID) and conversion type required', 400);
      }

      const adRequest = await prisma.adRequest.findUnique({
        where: { requestId: id },
        include: { adUnit: true }
      });

      if (!adRequest) {
        throw createError('Ad request not found', 404);
      }

      // Create conversion event
      const conversionEvent = await prisma.analyticsEvent.create({
        data: {
          organizationId: adRequest.organizationId,
          eventType: 'conversion',
          eventData: {
            adRequestId: adRequest.id,
            conversionType,
            conversionValue: conversionValue || 0,
            timestamp: timestamp ? new Date(timestamp) : new Date()
          },
          timestamp: timestamp ? new Date(timestamp) : new Date()
        }
      });

      // Update ad metrics if ad was served
      if (adRequest.servedAdId) {
        await prisma.advertiserAd.update({
          where: { id: adRequest.servedAdId },
          data: {
            conversions: { increment: 1 }
          }
        });
      }

      res.json({ 
        success: true,
        message: 'Conversion tracked successfully',
        conversionId: conversionEvent.id
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get ad request status
  app.get(`${prefix}/request/:requestId`, async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;

      const adRequest = await prisma.adRequest.findUnique({
        where: { requestId },
        include: {
          adUnit: true
        }
      });

      if (!adRequest) {
        throw createError('Ad request not found', 404);
      }

      res.json({
        success: true,
        data: {
          id: adRequest.id,
          requestId: adRequest.requestId,
          status: adRequest.status,
          impression: adRequest.impression,
          clickThrough: adRequest.clickThrough,
          adUnit: adRequest.adUnit,
          servedAdId: adRequest.servedAdId,
          createdAt: adRequest.createdAt
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

  // Get ad serving metrics
  app.get(`${prefix}/metrics`, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, organizationId } = req.query;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId: organizationId as string };

      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      const [totalRequests, servedRequests, impressions, clicks, conversions] = await Promise.all([
        prisma.adRequest.count({ where }),
        prisma.adRequest.count({ where: { ...where, status: 'SERVED' } }),
        prisma.adRequest.count({ where: { ...where, impression: true } }),
        prisma.adRequest.count({ where: { ...where, clickThrough: true } }),
        prisma.analyticsEvent.count({ 
          where: { 
            organizationId: where.organizationId,
            eventType: 'conversion'
          } 
        })
      ]);

      const fillRate = totalRequests > 0 ? (servedRequests / totalRequests) * 100 : 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

      res.json({
        success: true,
        metrics: {
          totalRequests,
          servedRequests,
          impressions,
          clicks,
          conversions,
          fillRate: Math.round(fillRate * 100) / 100,
          ctr: Math.round(ctr * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100
        },
        period: {
          startDate: startDate || 'all',
          endDate: endDate || 'all'
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
} 