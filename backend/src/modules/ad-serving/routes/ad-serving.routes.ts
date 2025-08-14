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
    } catch (error) {
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
      const { requestId } = req.body;

      if (!requestId) {
        throw createError('Request ID required', 400);
      }

      const adRequest = await prisma.adRequest.findUnique({
        where: { requestId }
      });

      if (!adRequest) {
        throw createError('Ad request not found', 404);
      }

      // Update impression status
      await prisma.adRequest.update({
        where: { id: adRequest.id },
        data: { impression: true }
      });

      res.json({ message: 'Impression tracked successfully' });
    } catch (error) {
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
      const { requestId } = req.body;

      if (!requestId) {
        throw createError('Request ID required', 400);
      }

      const adRequest = await prisma.adRequest.findUnique({
        where: { requestId },
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

      res.json({ message: 'Click tracked successfully' });
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
} 