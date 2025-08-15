"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRTBRoutes = setupRTBRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupRTBRoutes(app, prefix) {
    app.get(`${prefix}/rtb/campaigns`, async (req, res) => {
        try {
            const { page = 1, limit = 50, status, exchange } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = {
                organizationId,
                type: 'RTB'
            };
            if (status) {
                where.status = status;
            }
            if (exchange) {
                where.exchange = exchange;
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [campaigns, total] = await Promise.all([
                prisma_1.prisma.rtbCampaign.findMany({
                    where,
                    include: {
                        exchanges: true,
                        bidRequests: true,
                        performance: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                prisma_1.prisma.rtbCampaign.count({ where })
            ]);
            res.json({
                campaigns,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
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
    app.post(`${prefix}/rtb/campaigns`, async (req, res) => {
        try {
            const { name, description, exchanges, bidStrategy, maxBid, budget, targeting, startDate, endDate } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!name || !exchanges || !bidStrategy || !maxBid) {
                throw (0, error_handler_1.createError)('Name, exchanges, bid strategy, and max bid are required', 400);
            }
            const campaign = await prisma_1.prisma.rtbCampaign.create({
                data: {
                    organizationId,
                    name,
                    description,
                    exchanges,
                    bidStrategy,
                    maxBid,
                    budget,
                    targeting: targeting || {},
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    status: 'DRAFT',
                    type: 'RTB',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            res.status(201).json({
                message: 'RTB campaign created successfully',
                campaign
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
    app.get(`${prefix}/rtb/bid-requests`, async (req, res) => {
        try {
            const { campaignId, status, startDate, endDate, page = 1, limit = 100 } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = { organizationId };
            if (campaignId) {
                where.campaignId = campaignId;
            }
            if (status) {
                where.status = status;
            }
            if (startDate && endDate) {
                where.createdAt = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [bidRequests, total] = await Promise.all([
                prisma_1.prisma.rtbBidRequest.findMany({
                    where,
                    include: {
                        campaign: true,
                        exchange: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                prisma_1.prisma.rtbBidRequest.count({ where })
            ]);
            res.json({
                bidRequests,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
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
    app.get(`${prefix}/rtb/performance`, async (req, res) => {
        try {
            const { campaignId, startDate, endDate, exchange } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = {
                organizationId,
                type: 'RTB'
            };
            if (campaignId) {
                where.campaignId = campaignId;
            }
            if (exchange) {
                where.exchange = exchange;
            }
            if (startDate && endDate) {
                where.date = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            const performance = await prisma_1.prisma.rtbPerformance.findMany({
                where,
                orderBy: { date: 'desc' }
            });
            const metrics = performance.reduce((acc, perf) => ({
                totalBidRequests: acc.totalBidRequests + perf.bidRequests,
                totalBids: acc.totalBids + perf.bids,
                totalWins: acc.totalWins + perf.wins,
                totalSpend: acc.totalSpend + Number(perf.spend),
                totalImpressions: acc.totalImpressions + perf.impressions,
                totalClicks: acc.totalClicks + perf.clicks
            }), { totalBidRequests: 0, totalBids: 0, totalWins: 0, totalSpend: 0, totalImpressions: 0, totalClicks: 0 });
            res.json({
                performance,
                metrics: {
                    ...metrics,
                    winRate: metrics.totalBidRequests > 0 ? (metrics.totalWins / metrics.totalBidRequests) * 100 : 0,
                    bidRate: metrics.totalBidRequests > 0 ? (metrics.totalBids / metrics.totalBidRequests) * 100 : 0,
                    ctr: metrics.totalImpressions > 0 ? (metrics.totalClicks / metrics.totalImpressions) * 100 : 0,
                    cpm: metrics.totalImpressions > 0 ? (metrics.totalSpend / metrics.totalImpressions) * 1000 : 0
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
//# sourceMappingURL=rtb.routes.js.map