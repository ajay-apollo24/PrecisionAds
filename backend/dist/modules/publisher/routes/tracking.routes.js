"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTrackingRoutes = setupTrackingRoutes;
const data_tracking_service_1 = __importDefault(require("../services/data-tracking.service"));
const error_handler_1 = require("../../../shared/middleware/error-handler");
const audit_service_1 = __importDefault(require("../../../shared/services/audit.service"));
function setupTrackingRoutes(app, prefix) {
    app.post(`${prefix}/impression`, async (req, res) => {
        try {
            const { requestId, siteId, adUnitId, adId, userId, sessionId, ipAddress, userAgent, geoLocation, deviceInfo, viewability, viewTime, viewport } = req.body;
            if (!requestId || !siteId || !adUnitId || !adId) {
                throw (0, error_handler_1.createError)('Missing required fields: requestId, siteId, adUnitId, adId', 400);
            }
            await data_tracking_service_1.default.trackImpression({
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
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
    app.post(`${prefix}/click`, async (req, res) => {
        try {
            const { requestId, siteId, adUnitId, adId, userId, sessionId, ipAddress, userAgent, geoLocation, deviceInfo, clickPosition, referrer, landingPageUrl } = req.body;
            if (!requestId || !siteId || !adUnitId || !adId) {
                throw (0, error_handler_1.createError)('Missing required fields: requestId, siteId, adUnitId, adId', 400);
            }
            await data_tracking_service_1.default.trackClick({
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
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
    app.post(`${prefix}/conversion`, async (req, res) => {
        try {
            const { requestId, siteId, adUnitId, adId, userId, sessionId, ipAddress, userAgent, geoLocation, deviceInfo, transactionId, amount, currency, productId, category, conversionType } = req.body;
            if (!requestId || !siteId || !adUnitId || !adId || !transactionId || !amount || !conversionType) {
                throw (0, error_handler_1.createError)('Missing required fields: requestId, siteId, adUnitId, adId, transactionId, amount, conversionType', 400);
            }
            await data_tracking_service_1.default.trackTransaction({
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
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
    app.get(`${prefix}/stats/:siteId`, async (req, res) => {
        try {
            const { siteId } = req.params;
            const { startDate, endDate } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            let start;
            let end;
            if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);
            }
            const stats = await data_tracking_service_1.default.getSiteTrackingStats(siteId, start, end);
            res.json({
                success: true,
                data: stats,
                siteId,
                period: {
                    startDate: start?.toISOString(),
                    endDate: end?.toISOString()
                }
            });
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
    app.post(`${prefix}/batch`, async (req, res) => {
        try {
            const { events } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!Array.isArray(events) || events.length === 0) {
                throw (0, error_handler_1.createError)('Events array is required and must not be empty', 400);
            }
            const results = [];
            const errors = [];
            for (const event of events) {
                try {
                    switch (event.type) {
                        case 'impression':
                            await data_tracking_service_1.default.trackImpression({
                                ...event.data,
                                timestamp: new Date()
                            });
                            results.push({ id: event.id, type: 'impression', status: 'success' });
                            break;
                        case 'click':
                            await data_tracking_service_1.default.trackClick({
                                ...event.data,
                                timestamp: new Date()
                            });
                            results.push({ id: event.id, type: 'click', status: 'success' });
                            break;
                        case 'conversion':
                            await data_tracking_service_1.default.trackTransaction({
                                ...event.data,
                                timestamp: new Date()
                            });
                            results.push({ id: event.id, type: 'conversion', status: 'success' });
                            break;
                        default:
                            errors.push({ id: event.id, type: event.type, error: 'Unknown event type' });
                    }
                }
                catch (error) {
                    errors.push({
                        id: event.id,
                        type: event.type,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }
            audit_service_1.default.logPerformanceMetric('batch_tracking_events', events.length, 'count', 'AD_SERVING', {
                organizationId,
                successCount: results.length.toString(),
                errorCount: errors.length.toString()
            });
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
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
}
exports.default = setupTrackingRoutes;
//# sourceMappingURL=tracking.routes.js.map