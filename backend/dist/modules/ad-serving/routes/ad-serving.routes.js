"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAdServingRoutes = setupAdServingRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupAdServingRoutes(app, prefix) {
    app.post(`${prefix}/request`, async (req, res) => {
        try {
            const { siteId, adUnitId, requestId, userAgent, ipAddress, geoLocation, deviceInfo, targeting } = req.body;
            if (!siteId || !adUnitId || !requestId) {
                throw (0, error_handler_1.createError)('Missing required fields: siteId, adUnitId, requestId', 400);
            }
            const site = await prisma_1.prisma.publisherSite.findUnique({
                where: { id: siteId },
                include: { organization: true }
            });
            if (!site) {
                throw (0, error_handler_1.createError)('Site not found', 404);
            }
            const adUnit = await prisma_1.prisma.adUnit.findUnique({
                where: { id: adUnitId }
            });
            if (!adUnit) {
                throw (0, error_handler_1.createError)('Ad unit not found', 404);
            }
            const adRequest = await prisma_1.prisma.adRequest.create({
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
            const eligibleAds = await prisma_1.prisma.advertiserAd.findMany({
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
            let selectedAd = null;
            if (eligibleAds.length > 0) {
                selectedAd = eligibleAds[Math.floor(Math.random() * eligibleAds.length)];
                await prisma_1.prisma.adRequest.update({
                    where: { id: adRequest.id },
                    data: {
                        servedAdId: selectedAd.id,
                        status: 'SERVED',
                        impression: true
                    }
                });
                await prisma_1.prisma.advertiserAd.update({
                    where: { id: selectedAd.id },
                    data: {
                        impressions: { increment: 1 }
                    }
                });
            }
            else {
                await prisma_1.prisma.adRequest.update({
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
    app.post(`${prefix}/impression`, async (req, res) => {
        try {
            const { requestId } = req.body;
            if (!requestId) {
                throw (0, error_handler_1.createError)('Request ID required', 400);
            }
            const adRequest = await prisma_1.prisma.adRequest.findUnique({
                where: { requestId }
            });
            if (!adRequest) {
                throw (0, error_handler_1.createError)('Ad request not found', 404);
            }
            await prisma_1.prisma.adRequest.update({
                where: { id: adRequest.id },
                data: { impression: true }
            });
            res.json({ message: 'Impression tracked successfully' });
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
            const { requestId } = req.body;
            if (!requestId) {
                throw (0, error_handler_1.createError)('Request ID required', 400);
            }
            const adRequest = await prisma_1.prisma.adRequest.findUnique({
                where: { requestId },
                include: { adUnit: true }
            });
            if (!adRequest) {
                throw (0, error_handler_1.createError)('Ad request not found', 404);
            }
            await prisma_1.prisma.adRequest.update({
                where: { id: adRequest.id },
                data: { clickThrough: true }
            });
            if (adRequest.servedAdId) {
                await prisma_1.prisma.advertiserAd.update({
                    where: { id: adRequest.servedAdId },
                    data: {
                        clicks: { increment: 1 }
                    }
                });
            }
            res.json({ message: 'Click tracked successfully' });
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
//# sourceMappingURL=ad-serving.routes.js.map