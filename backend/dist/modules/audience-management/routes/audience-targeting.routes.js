"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAudienceTargetingRoutes = setupAudienceTargetingRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupAudienceTargetingRoutes(app, prefix) {
    app.get(`${prefix}/targeting-rules`, async (req, res) => {
        try {
            const { page = 1, limit = 50, type, status } = req.query;
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
            const skip = (Number(page) - 1) * Number(limit);
            const [rules, total] = await Promise.all([
                prisma_1.prisma.targetingRule.findMany({
                    where,
                    include: {
                        conditions: true,
                        performanceMetrics: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                prisma_1.prisma.targetingRule.count({ where })
            ]);
            res.json({
                rules,
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
    app.post(`${prefix}/targeting-rules`, async (req, res) => {
        try {
            const { name, description, type, conditions, priority, status = 'DRAFT' } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!name || !type || !conditions) {
                throw (0, error_handler_1.createError)('Name, type, and conditions are required', 400);
            }
            const rule = await prisma_1.prisma.targetingRule.create({
                data: {
                    organizationId,
                    name,
                    description,
                    type,
                    conditions: conditions || {},
                    priority: priority || 1,
                    status,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            res.status(201).json({
                message: 'Targeting rule created successfully',
                rule
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
    app.post(`${prefix}/targeting-rules/:id/test`, async (req, res) => {
        try {
            const { id } = req.params;
            const { sampleData } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!sampleData) {
                throw (0, error_handler_1.createError)('Sample data required', 400);
            }
            const rule = await prisma_1.prisma.targetingRule.findFirst({
                where: {
                    id,
                    organizationId
                }
            });
            if (!rule) {
                throw (0, error_handler_1.createError)('Targeting rule not found', 404);
            }
            const targetingResults = sampleData.map((data) => {
                const matches = evaluateTargetingRule(rule.conditions, data);
                return {
                    data,
                    matches,
                    score: matches ? calculateTargetingScore(rule.conditions, data) : 0
                };
            });
            const summary = {
                totalSamples: targetingResults.length,
                matchingSamples: targetingResults.filter((r) => r.matches).length,
                averageScore: targetingResults.reduce((sum, r) => sum + r.score, 0) / targetingResults.length
            };
            res.json({
                rule,
                targetingResults,
                summary
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
    app.get(`${prefix}/targeting-rules/:id/performance`, async (req, res) => {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = {
                targetingRuleId: id,
                organizationId
            };
            if (startDate && endDate) {
                where.date = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            const performance = await prisma_1.prisma.targetingRulePerformance.findMany({
                where,
                orderBy: { date: 'desc' }
            });
            const metrics = performance.reduce((acc, perf) => ({
                totalImpressions: acc.totalImpressions + perf.impressions,
                totalClicks: acc.totalClicks + perf.clicks,
                totalConversions: acc.totalConversions + perf.conversions,
                totalRevenue: acc.totalRevenue + Number(perf.revenue),
                targetingAccuracy: acc.targetingAccuracy + perf.targetingAccuracy
            }), { totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalRevenue: 0, targetingAccuracy: 0 });
            res.json({
                performance,
                metrics: {
                    ...metrics,
                    ctr: metrics.totalImpressions > 0 ? (metrics.totalClicks / metrics.totalImpressions) * 100 : 0,
                    conversionRate: metrics.totalClicks > 0 ? (metrics.totalConversions / metrics.totalClicks) * 100 : 0,
                    averageTargetingAccuracy: metrics.targetingAccuracy / performance.length
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
function evaluateTargetingRule(conditions, data) {
    return Math.random() > 0.5;
}
function calculateTargetingScore(conditions, data) {
    return Math.random() * 100;
}
//# sourceMappingURL=audience-targeting.routes.js.map