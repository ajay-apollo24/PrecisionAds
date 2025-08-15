"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTrackingService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const db_logger_1 = require("../../../shared/middleware/db-logger");
const audit_service_1 = __importDefault(require("../../../shared/services/audit.service"));
class DataTrackingService {
    static async trackImpression(data) {
        const startTime = Date.now();
        try {
            await (0, db_logger_1.withQueryLogging)('track_impression', data, async () => {
                await prisma_1.prisma.adRequest.update({
                    where: { requestId: data.requestId },
                    data: {
                        impression: true,
                        updatedAt: new Date()
                    }
                });
                await prisma_1.prisma.advertiserAd.update({
                    where: { id: data.adId },
                    data: {
                        impressions: { increment: 1 }
                    }
                });
                await prisma_1.prisma.analyticsEvent.create({
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
                await this.updateDailyEarnings(data.siteId, 'impression');
            }, { operation: 'impression_tracking' });
            audit_service_1.default.logAdServingEvent(data.userId || 'anonymous', 'impression_tracked', 'AD_IMPRESSION', data.requestId, {
                adId: data.adId,
                siteId: data.siteId,
                adUnitId: data.adUnitId,
                viewability: data.viewability,
                viewTime: data.viewTime
            });
            const duration = Date.now() - startTime;
            audit_service_1.default.logPerformanceMetric('impression_tracking_duration', duration, 'ms', 'AD_SERVING', { siteId: data.siteId, adId: data.adId });
        }
        catch (error) {
            throw new Error(`Failed to track impression: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async trackClick(data) {
        const startTime = Date.now();
        try {
            await (0, db_logger_1.withQueryLogging)('track_click', data, async () => {
                await prisma_1.prisma.adRequest.update({
                    where: { requestId: data.requestId },
                    data: {
                        clickThrough: true,
                        updatedAt: new Date()
                    }
                });
                await prisma_1.prisma.advertiserAd.update({
                    where: { id: data.adId },
                    data: {
                        clicks: { increment: 1 }
                    }
                });
                await prisma_1.prisma.analyticsEvent.create({
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
                await this.updateDailyEarnings(data.siteId, 'click');
            }, { operation: 'click_tracking' });
            audit_service_1.default.logAdServingEvent(data.userId || 'anonymous', 'click_tracked', 'AD_CLICK', data.requestId, {
                adId: data.adId,
                siteId: data.siteId,
                adUnitId: data.adUnitId,
                clickPosition: data.clickPosition,
                referrer: data.referrer
            });
            const duration = Date.now() - startTime;
            audit_service_1.default.logPerformanceMetric('click_tracking_duration', duration, 'ms', 'AD_SERVING', { siteId: data.siteId, adId: data.adId });
        }
        catch (error) {
            throw new Error(`Failed to track click: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async trackTransaction(data) {
        const startTime = Date.now();
        try {
            await (0, db_logger_1.withQueryLogging)('track_transaction', data, async () => {
                await prisma_1.prisma.analyticsEvent.create({
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
                await prisma_1.prisma.advertiserAd.update({
                    where: { id: data.adId },
                    data: {
                        conversions: { increment: 1 }
                    }
                });
                audit_service_1.default.logFinancialEvent(data.userId || 'anonymous', 'conversion_tracked', 'AD_CONVERSION', data.transactionId, data.amount, data.currency, {
                    adId: data.adId,
                    siteId: data.siteId,
                    conversionType: data.conversionType,
                    productId: data.productId,
                    category: data.category
                });
            }, { operation: 'transaction_tracking' });
            const duration = Date.now() - startTime;
            audit_service_1.default.logPerformanceMetric('transaction_tracking_duration', duration, 'ms', 'AD_SERVING', { siteId: data.siteId, adId: data.adId, conversionType: data.conversionType });
        }
        catch (error) {
            throw new Error(`Failed to track transaction: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async getOrganizationId(siteId) {
        const site = await prisma_1.prisma.publisherSite.findUnique({
            where: { id: siteId },
            select: { organizationId: true }
        });
        if (!site) {
            throw new Error(`Site not found: ${siteId}`);
        }
        return site.organizationId;
    }
    static async updateDailyEarnings(siteId, eventType) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const site = await prisma_1.prisma.publisherSite.findUnique({
            where: { id: siteId },
            select: { organizationId: true }
        });
        if (!site)
            return;
        let earnings = await prisma_1.prisma.publisherEarning.findUnique({
            where: {
                organizationId_siteId_date: {
                    organizationId: site.organizationId,
                    siteId,
                    date: today
                }
            }
        });
        if (!earnings) {
            earnings = await prisma_1.prisma.publisherEarning.create({
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
        const updateData = {};
        if (eventType === 'impression') {
            updateData.impressions = { increment: 1 };
        }
        else if (eventType === 'click') {
            updateData.clicks = { increment: 1 };
        }
        await prisma_1.prisma.publisherEarning.update({
            where: { id: earnings.id },
            data: updateData
        });
    }
    static async getSiteTrackingStats(siteId, startDate, endDate) {
        const where = { siteId };
        if (startDate && endDate) {
            where.date = {
                gte: startDate,
                lte: endDate
            };
        }
        const [impressions, clicks, conversions] = await Promise.all([
            prisma_1.prisma.analyticsEvent.count({
                where: {
                    ...where,
                    eventType: 'impression'
                }
            }),
            prisma_1.prisma.analyticsEvent.count({
                where: {
                    ...where,
                    eventType: 'click'
                }
            }),
            prisma_1.prisma.analyticsEvent.count({
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
exports.DataTrackingService = DataTrackingService;
exports.default = DataTrackingService;
//# sourceMappingURL=data-tracking.service.js.map