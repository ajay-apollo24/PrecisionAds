"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupProgrammaticRoutes = setupProgrammaticRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupProgrammaticRoutes(app, prefix) {
    app.get(`${prefix}/programmatic/deals`, async (req, res) => {
        try {
            const { page = 1, limit = 50, type, status, publisher } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = { organizationId };
            if (type) {
                where.type = type;
            }
            if (status) {
                where.status = status;
            }
            if (publisher) {
                where.publisherId = publisher;
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [deals, total] = await Promise.all([
                prisma_1.prisma.programmaticDeal.findMany({
                    where,
                    include: {
                        publisher: true,
                        campaign: true,
                        performance: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                prisma_1.prisma.programmaticDeal.count({ where })
            ]);
            res.json({
                deals,
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
    app.post(`${prefix}/programmatic/deals`, async (req, res) => {
        try {
            const { name, type, publisherId, campaignId, dealTerms, targeting, budget, startDate, endDate } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!name || !type || !publisherId || !dealTerms) {
                throw (0, error_handler_1.createError)('Name, type, publisher ID, and deal terms are required', 400);
            }
            const deal = await prisma_1.prisma.programmaticDeal.create({
                data: {
                    organizationId,
                    name,
                    type,
                    publisherId,
                    campaignId,
                    dealTerms,
                    targeting: targeting || {},
                    budget,
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    status: 'DRAFT',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            res.status(201).json({
                message: 'Programmatic deal created successfully',
                deal
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
    app.get(`${prefix}/programmatic/inventory`, async (req, res) => {
        try {
            const { publisherId, adUnitType, geoLocation, startDate, endDate } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = { organizationId };
            if (publisherId) {
                where.publisherId = publisherId;
            }
            if (adUnitType) {
                where.adUnitType = adUnitType;
            }
            if (geoLocation) {
                where.geoLocation = geoLocation;
            }
            if (startDate && endDate) {
                where.date = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            const inventory = await prisma_1.prisma.programmaticInventory.findMany({
                where,
                include: {
                    publisher: true,
                    adUnit: true,
                    availability: true
                },
                orderBy: { date: 'desc' }
            });
            const metrics = inventory.reduce((acc, inv) => ({
                totalImpressions: acc.totalImpressions + inv.availableImpressions,
                totalRevenue: acc.totalRevenue + Number(inv.estimatedRevenue),
                averageCPM: acc.averageCPM + Number(inv.estimatedCPM)
            }), { totalImpressions: 0, totalRevenue: 0, averageCPM: 0 });
            res.json({
                inventory,
                metrics: {
                    ...metrics,
                    averageCPM: metrics.averageCPM / inventory.length
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
    app.get(`${prefix}/programmatic/performance`, async (req, res) => {
        try {
            const { dealId, startDate, endDate, publisherId } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = {
                organizationId,
                type: 'PROGRAMMATIC'
            };
            if (dealId) {
                where.dealId = dealId;
            }
            if (publisherId) {
                where.publisherId = publisherId;
            }
            if (startDate && endDate) {
                where.date = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            const performance = await prisma_1.prisma.programmaticPerformance.findMany({
                where,
                orderBy: { date: 'desc' }
            });
            const metrics = performance.reduce((acc, perf) => ({
                totalImpressions: acc.totalImpressions + perf.impressions,
                totalClicks: acc.totalClicks + perf.clicks,
                totalConversions: acc.totalConversions + perf.conversions,
                totalSpend: acc.totalSpend + Number(perf.spend),
                totalRevenue: acc.totalRevenue + Number(perf.revenue)
            }), { totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalSpend: 0, totalRevenue: 0 });
            res.json({
                performance,
                metrics: {
                    ...metrics,
                    ctr: metrics.totalImpressions > 0 ? (metrics.totalClicks / metrics.totalImpressions) * 100 : 0,
                    conversionRate: metrics.totalClicks > 0 ? (metrics.totalConversions / metrics.totalClicks) * 100 : 0,
                    roas: metrics.totalSpend > 0 ? metrics.totalRevenue / metrics.totalSpend : 0,
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
//# sourceMappingURL=programmatic.routes.js.map