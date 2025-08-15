"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAnalyticsRoutes = setupAnalyticsRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupAnalyticsRoutes(app, prefix) {
    app.get(`${prefix}/campaigns/:campaignId/analytics`, async (req, res) => {
        try {
            const { campaignId } = req.params;
            const { startDate, endDate } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const campaign = await prisma_1.prisma.advertiserCampaign.findFirst({
                where: {
                    id: campaignId,
                    organizationId
                },
                include: {
                    ads: true
                }
            });
            if (!campaign) {
                throw (0, error_handler_1.createError)('Campaign not found', 404);
            }
            const adPerformance = await prisma_1.prisma.advertiserAd.findMany({
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
//# sourceMappingURL=analytics.routes.js.map