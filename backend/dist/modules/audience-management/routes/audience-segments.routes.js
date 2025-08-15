"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAudienceSegmentsRoutes = setupAudienceSegmentsRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupAudienceSegmentsRoutes(app, prefix) {
    app.get(`${prefix}/segments`, async (req, res) => {
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
            const [segments, total] = await Promise.all([
                prisma_1.prisma.audienceSegment.findMany({
                    where,
                    include: {
                        targetingRules: true,
                        performanceMetrics: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                prisma_1.prisma.audienceSegment.count({ where })
            ]);
            res.json({
                segments,
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
    app.post(`${prefix}/segments`, async (req, res) => {
        try {
            const { name, description, type, targetingRules, estimatedSize, status = 'DRAFT' } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!name || !type) {
                throw (0, error_handler_1.createError)('Name and type are required', 400);
            }
            const segment = await prisma_1.prisma.audienceSegment.create({
                data: {
                    organizationId,
                    name,
                    description,
                    type,
                    targetingRules: targetingRules || {},
                    estimatedSize,
                    status,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            res.status(201).json({
                message: 'Audience segment created successfully',
                segment
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
    app.put(`${prefix}/segments/:id`, async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const segment = await prisma_1.prisma.audienceSegment.findFirst({
                where: {
                    id,
                    organizationId
                }
            });
            if (!segment) {
                throw (0, error_handler_1.createError)('Audience segment not found', 404);
            }
            const updatedSegment = await prisma_1.prisma.audienceSegment.update({
                where: { id },
                data: {
                    ...updateData,
                    updatedAt: new Date()
                }
            });
            res.json({
                message: 'Audience segment updated successfully',
                segment: updatedSegment
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
    app.get(`${prefix}/segments/:id/performance`, async (req, res) => {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = {
                segmentId: id,
                organizationId
            };
            if (startDate && endDate) {
                where.date = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            const metrics = await prisma_1.prisma.audienceSegmentPerformance.findMany({
                where,
                orderBy: { date: 'desc' }
            });
            const aggregated = metrics.reduce((acc, metric) => ({
                totalImpressions: acc.totalImpressions + metric.impressions,
                totalClicks: acc.totalClicks + metric.clicks,
                totalConversions: acc.totalConversions + metric.conversions,
                totalRevenue: acc.totalRevenue + Number(metric.revenue)
            }), { totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalRevenue: 0 });
            res.json({
                metrics,
                aggregated,
                ctr: aggregated.totalImpressions > 0 ? (aggregated.totalClicks / aggregated.totalImpressions) * 100 : 0,
                conversionRate: aggregated.totalClicks > 0 ? (aggregated.totalConversions / aggregated.totalClicks) * 100 : 0
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
//# sourceMappingURL=audience-segments.routes.js.map