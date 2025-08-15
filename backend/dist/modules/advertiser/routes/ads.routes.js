"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAdsRoutes = setupAdsRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupAdsRoutes(app, prefix) {
    app.get(`${prefix}/campaigns/:campaignId/ads`, async (req, res) => {
        try {
            const { campaignId } = req.params;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const ads = await prisma_1.prisma.advertiserAd.findMany({
                where: {
                    campaignId,
                    organizationId
                },
                include: {
                    campaign: true
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ ads });
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
    app.post(`${prefix}/campaigns/:campaignId/ads`, async (req, res) => {
        try {
            const { campaignId } = req.params;
            const { name, creativeType, creativeUrl, landingPageUrl, weight, targeting } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!name || !creativeType || !creativeUrl || !landingPageUrl) {
                throw (0, error_handler_1.createError)('Missing required fields', 400);
            }
            const ad = await prisma_1.prisma.advertiserAd.create({
                data: {
                    organizationId,
                    campaignId,
                    name,
                    creativeType,
                    creativeUrl,
                    landingPageUrl,
                    weight: weight || 100,
                    targeting: targeting || {}
                }
            });
            res.status(201).json({
                message: 'Ad created successfully',
                ad
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
//# sourceMappingURL=ads.routes.js.map