import { prisma } from '../../../shared/database/prisma';
import { withQueryLogging } from '../../../shared/middleware/db-logger';
import AuditService from '../../../shared/services/audit.service';

export interface TrackingData {
  requestId: string;
  siteId: string;
  adUnitId: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: any;
  deviceInfo?: any;
  timestamp: Date;
}

export interface ImpressionData extends TrackingData {
  adId: string;
  viewability?: number;
  viewTime?: number;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface ClickData extends TrackingData {
  adId: string;
  clickPosition?: {
    x: number;
    y: number;
  };
  referrer?: string;
  landingPageUrl?: string;
}

export interface TransactionData extends TrackingData {
  adId: string;
  transactionId: string;
  amount: number;
  currency: string;
  productId?: string;
  category?: string;
  conversionType: 'purchase' | 'signup' | 'download' | 'other';
}

export class DataTrackingService {
  /**
   * Track ad impression
   */
  static async trackImpression(data: ImpressionData): Promise<void> {
    const startTime = Date.now();
    
    try {
      await withQueryLogging(
        'track_impression',
        data,
        async () => {
          // Update ad request with impression data
          await prisma.adRequest.update({
            where: { requestId: data.requestId },
            data: {
              impression: true,
              updatedAt: new Date()
            }
          });

          // Update ad metrics
          await prisma.advertiserAd.update({
            where: { id: data.adId },
            data: {
              impressions: { increment: 1 }
            }
          });

          // Create impression record
          await prisma.analyticsEvent.create({
            data: {
              organizationId: await this.getOrganizationId(data.siteId),
              eventType: 'impression',
              eventData: {
                adId: data.adId,
                siteId: data.siteId,
                adUnitId: data.adUnitId,
                requestId: data.requestId,
                viewability: data.viewability,
                viewTime: data.viewTime,
                viewport: data.viewport,
                geoLocation: data.geoLocation,
                deviceInfo: data.deviceInfo,
                timestamp: data.timestamp
              },
              userId: data.userId,
              sessionId: data.sessionId
            }
          });

          // Update daily earnings
          await this.updateDailyEarnings(data.siteId, 'impression');
        },
        { operation: 'impression_tracking' }
      );

      // Log audit event
      AuditService.logAdServingEvent(
        data.userId || 'anonymous',
        'impression_tracked',
        'AD_IMPRESSION',
        data.requestId,
        {
          adId: data.adId,
          siteId: data.siteId,
          adUnitId: data.adUnitId,
          viewability: data.viewability,
          viewTime: data.viewTime
        }
      );

      // Log performance metric
      const duration = Date.now() - startTime;
      AuditService.logPerformanceMetric(
        'impression_tracking_duration',
        duration,
        'ms',
        'AD_SERVING',
        { siteId: data.siteId, adId: data.adId }
      );

    } catch (error) {
      throw new Error(`Failed to track impression: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Track ad click
   */
  static async trackClick(data: ClickData): Promise<void> {
    const startTime = Date.now();
    
    try {
      await withQueryLogging(
        'track_click',
        data,
        async () => {
          // Update ad request with click data
          await prisma.adRequest.update({
            where: { requestId: data.requestId },
            data: {
              clickThrough: true,
              updatedAt: new Date()
            }
          });

          // Update ad metrics
          await prisma.advertiserAd.update({
            where: { id: data.adId },
            data: {
              clicks: { increment: 1 }
            }
          });

          // Create click event
          await prisma.analyticsEvent.create({
            data: {
              organizationId: await this.getOrganizationId(data.siteId),
              eventType: 'click',
              eventData: {
                adId: data.adId,
                siteId: data.siteId,
                adUnitId: data.adUnitId,
                requestId: data.requestId,
                clickPosition: data.clickPosition,
                referrer: data.referrer,
                landingPageUrl: data.landingPageUrl,
                geoLocation: data.geoLocation,
                deviceInfo: data.deviceInfo,
                timestamp: data.timestamp
              },
              userId: data.userId,
              sessionId: data.sessionId
            }
          });

          // Update daily earnings
          await this.updateDailyEarnings(data.siteId, 'click');
        },
        { operation: 'click_tracking' }
      );

      // Log audit event
      AuditService.logAdServingEvent(
        data.userId || 'anonymous',
        'click_tracked',
        'AD_CLICK',
        data.requestId,
        {
          adId: data.adId,
          siteId: data.siteId,
          adUnitId: data.adUnitId,
          clickPosition: data.clickPosition,
          referrer: data.referrer
        }
      );

      // Log performance metric
      const duration = Date.now() - startTime;
      AuditService.logPerformanceMetric(
        'click_tracking_duration',
        duration,
        'ms',
        'AD_SERVING',
        { siteId: data.siteId, adId: data.adId }
      );

    } catch (error) {
      throw new Error(`Failed to track click: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Track transaction/conversion
   */
  static async trackTransaction(data: TransactionData): Promise<void> {
    const startTime = Date.now();
    
    try {
      await withQueryLogging(
        'track_transaction',
        data,
        async () => {
          // Create conversion event
          await prisma.analyticsEvent.create({
            data: {
              organizationId: await this.getOrganizationId(data.siteId),
              eventType: 'conversion',
              eventData: {
                adId: data.adId,
                siteId: data.siteId,
                adUnitId: data.adUnitId,
                requestId: data.requestId,
                transactionId: data.transactionId,
                amount: data.amount,
                currency: data.currency,
                productId: data.productId,
                category: data.category,
                conversionType: data.conversionType,
                geoLocation: data.geoLocation,
                deviceInfo: data.deviceInfo,
                timestamp: data.timestamp
              },
              userId: data.userId,
              sessionId: data.sessionId
            }
          });

          // Update ad conversion metrics
          await prisma.advertiserAd.update({
            where: { id: data.adId },
            data: {
              conversions: { increment: 1 }
            }
          });

          // Log financial event
          AuditService.logFinancialEvent(
            data.userId || 'anonymous',
            'conversion_tracked',
            'AD_CONVERSION',
            data.transactionId,
            data.amount,
            data.currency,
            {
              adId: data.adId,
              siteId: data.siteId,
              conversionType: data.conversionType,
              productId: data.productId,
              category: data.category
            }
          );
        },
        { operation: 'transaction_tracking' }
      );

      // Log performance metric
      const duration = Date.now() - startTime;
      AuditService.logPerformanceMetric(
        'transaction_tracking_duration',
        duration,
        'ms',
        'AD_SERVING',
        { siteId: data.siteId, adId: data.adId, conversionType: data.conversionType }
      );

    } catch (error) {
      throw new Error(`Failed to track transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get organization ID for a site
   */
  private static async getOrganizationId(siteId: string): Promise<string> {
    const site = await prisma.publisherSite.findUnique({
      where: { id: siteId },
      select: { organizationId: true }
    });
    
    if (!site) {
      throw new Error(`Site not found: ${siteId}`);
    }
    
    return site.organizationId;
  }

  /**
   * Update daily earnings for a site
   */
  private static async updateDailyEarnings(siteId: string, eventType: 'impression' | 'click'): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const site = await prisma.publisherSite.findUnique({
      where: { id: siteId },
      select: { organizationId: true }
    });

    if (!site) return;

    // Get or create daily earnings record
    let earnings = await prisma.publisherEarning.findUnique({
      where: {
        organizationId_siteId_date: {
          organizationId: site.organizationId,
          siteId,
          date: today
        }
      }
    });

    if (!earnings) {
      earnings = await prisma.publisherEarning.create({
        data: {
          organizationId: site.organizationId,
          siteId,
          date: today,
          impressions: 0,
          clicks: 0,
          revenue: 0,
          cpm: 0,
          cpc: 0
        }
      });
    }

    // Update metrics
    const updateData: any = {};
    if (eventType === 'impression') {
      updateData.impressions = { increment: 1 };
    } else if (eventType === 'click') {
      updateData.clicks = { increment: 1 };
    }

    await prisma.publisherEarning.update({
      where: { id: earnings.id },
      data: updateData
    });
  }

  /**
   * Get tracking statistics for a site
   */
  static async getSiteTrackingStats(siteId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const where: any = { siteId };
    
    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const [impressions, clicks, conversions] = await Promise.all([
      prisma.analyticsEvent.count({
        where: {
          ...where,
          eventType: 'impression'
        }
      }),
      prisma.analyticsEvent.count({
        where: {
          ...where,
          eventType: 'click'
        }
      }),
      prisma.analyticsEvent.count({
        where: {
          ...where,
          eventType: 'conversion'
        }
      })
    ]);

    return {
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0
    };
  }
}

export default DataTrackingService; 