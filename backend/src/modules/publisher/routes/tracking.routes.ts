import { Express, Request, Response } from 'express';
import DataTrackingService from '../services/data-tracking.service';
import { createError } from '../../../shared/middleware/error-handler';
import AuditService from '../../../shared/services/audit.service';

export function setupTrackingRoutes(app: Express, prefix: string): void {
  // Track ad impression with detailed data
  app.post(`${prefix}/impression`, async (req: Request, res: Response) => {
    try {
      const {
        requestId,
        siteId,
        adUnitId,
        adId,
        userId,
        sessionId,
        ipAddress,
        userAgent,
        geoLocation,
        deviceInfo,
        viewability,
        viewTime,
        viewport
      } = req.body;

      if (!requestId || !siteId || !adUnitId || !adId) {
        throw createError('Missing required fields: requestId, siteId, adUnitId, adId', 400);
      }

      await DataTrackingService.trackImpression({
        requestId,
        siteId,
        adUnitId,
        adId,
        userId,
        sessionId,
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.get('User-Agent'),
        geoLocation,
        deviceInfo,
        viewability,
        viewTime,
        viewport,
        timestamp: new Date()
      });

      res.json({ 
        success: true, 
        message: 'Impression tracked successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Track ad click with detailed data
  app.post(`${prefix}/click`, async (req: Request, res: Response) => {
    try {
      const {
        requestId,
        siteId,
        adUnitId,
        adId,
        userId,
        sessionId,
        ipAddress,
        userAgent,
        geoLocation,
        deviceInfo,
        clickPosition,
        referrer,
        landingPageUrl
      } = req.body;

      if (!requestId || !siteId || !adUnitId || !adId) {
        throw createError('Missing required fields: requestId, siteId, adUnitId, adId', 400);
      }

      await DataTrackingService.trackClick({
        requestId,
        siteId,
        adUnitId,
        adId,
        userId,
        sessionId,
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.get('User-Agent'),
        geoLocation,
        deviceInfo,
        clickPosition,
        referrer: referrer || req.get('Referrer'),
        landingPageUrl,
        timestamp: new Date()
      });

      res.json({ 
        success: true, 
        message: 'Click tracked successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Track transaction/conversion
  app.post(`${prefix}/conversion`, async (req: Request, res: Response) => {
    try {
      const {
        requestId,
        siteId,
        adUnitId,
        adId,
        userId,
        sessionId,
        ipAddress,
        userAgent,
        geoLocation,
        deviceInfo,
        transactionId,
        amount,
        currency,
        productId,
        category,
        conversionType
      } = req.body;

      if (!requestId || !siteId || !adUnitId || !adId || !transactionId || !amount || !conversionType) {
        throw createError('Missing required fields: requestId, siteId, adUnitId, adId, transactionId, amount, conversionType', 400);
      }

      await DataTrackingService.trackTransaction({
        requestId,
        siteId,
        adUnitId,
        adId,
        userId,
        sessionId,
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.get('User-Agent'),
        geoLocation,
        deviceInfo,
        transactionId,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        productId,
        category,
        conversionType,
        timestamp: new Date()
      });

      res.json({ 
        success: true, 
        message: 'Conversion tracked successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get tracking statistics for a site
  app.get(`${prefix}/stats/:siteId`, async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { startDate, endDate } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      let start: Date | undefined;
      let end: Date | undefined;

      if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
      }

      const stats = await DataTrackingService.getSiteTrackingStats(siteId, start, end);

      res.json({
        success: true,
        data: stats,
        siteId,
        period: {
          startDate: start?.toISOString(),
          endDate: end?.toISOString()
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

  // Batch tracking endpoint for multiple events
  app.post(`${prefix}/batch`, async (req: Request, res: Response) => {
    try {
      const { events } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!Array.isArray(events) || events.length === 0) {
        throw createError('Events array is required and must not be empty', 400);
      }

      const results = [];
      const errors = [];

      for (const event of events) {
        try {
          switch (event.type) {
            case 'impression':
              await DataTrackingService.trackImpression({
                ...event.data,
                timestamp: new Date()
              });
              results.push({ id: event.id, type: 'impression', status: 'success' });
              break;

            case 'click':
              await DataTrackingService.trackClick({
                ...event.data,
                timestamp: new Date()
              });
              results.push({ id: event.id, type: 'click', status: 'success' });
              break;

            case 'conversion':
              await DataTrackingService.trackTransaction({
                ...event.data,
                timestamp: new Date()
              });
              results.push({ id: event.id, type: 'conversion', status: 'success' });
              break;

            default:
              errors.push({ id: event.id, type: event.type, error: 'Unknown event type' });
          }
        } catch (error: any) {
          errors.push({ 
            id: event.id, 
            type: event.type, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }

      // Log batch processing metrics
      AuditService.logPerformanceMetric(
        'batch_tracking_events',
        events.length,
        'count',
        'AD_SERVING',
        {
          organizationId,
          successCount: results.length.toString(),
          errorCount: errors.length.toString()
        }
      );

      res.json({
        success: true,
        message: 'Batch tracking completed',
        results: {
          total: events.length,
          successful: results.length,
          failed: errors.length,
          events: results,
          errors
        },
        timestamp: new Date().toISOString()
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

export default setupTrackingRoutes; 