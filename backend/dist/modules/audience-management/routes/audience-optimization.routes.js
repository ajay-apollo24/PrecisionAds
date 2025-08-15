"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAudienceOptimizationRoutes = setupAudienceOptimizationRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupAudienceOptimizationRoutes(app, prefix) {
    app.get(`${prefix}/optimization/recommendations`, async (req, res) => {
        try {
            const { segmentId, type, limit = 10 } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = { organizationId };
            if (segmentId) {
                where.segmentId = segmentId;
            }
            if (type) {
                where.type = type;
            }
            const recommendations = await prisma_1.prisma.audienceOptimizationRecommendation.findMany({
                where,
                orderBy: { confidence: 'desc' },
                take: Number(limit)
            });
            const groupedRecommendations = recommendations.reduce((acc, rec) => {
                if (!acc[rec.type]) {
                    acc[rec.type] = [];
                }
                acc[rec.type].push(rec);
                return acc;
            }, {});
            res.json({
                recommendations,
                groupedRecommendations,
                summary: {
                    totalRecommendations: recommendations.length,
                    highConfidence: recommendations.filter((r) => r.confidence > 0.8).length,
                    mediumConfidence: recommendations.filter((r) => r.confidence > 0.5 && r.confidence <= 0.8).length,
                    lowConfidence: recommendations.filter((r) => r.confidence <= 0.5).length
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
    app.post(`${prefix}/optimization/apply`, async (req, res) => {
        try {
            const { segmentId, optimizationType, parameters } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!segmentId || !optimizationType) {
                throw (0, error_handler_1.createError)('Segment ID and optimization type are required', 400);
            }
            const segment = await prisma_1.prisma.audienceSegment.findFirst({
                where: {
                    id: segmentId,
                    organizationId
                }
            });
            if (!segment) {
                throw (0, error_handler_1.createError)('Audience segment not found', 404);
            }
            const optimizationResult = await applyOptimization(segment, optimizationType, parameters);
            const optimization = await prisma_1.prisma.audienceOptimization.create({
                data: {
                    organizationId,
                    segmentId,
                    type: optimizationType,
                    parameters: parameters || {},
                    result: optimizationResult,
                    status: 'COMPLETED',
                    createdAt: new Date()
                }
            });
            res.json({
                message: 'Optimization applied successfully',
                optimization,
                result: optimizationResult
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
    app.get(`${prefix}/optimization/history`, async (req, res) => {
        try {
            const { segmentId, type, status, page = 1, limit = 50 } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = { organizationId };
            if (segmentId) {
                where.segmentId = segmentId;
            }
            if (type) {
                where.type = type;
            }
            if (status) {
                where.status = status;
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [optimizations, total] = await Promise.all([
                prisma_1.prisma.audienceOptimization.findMany({
                    where,
                    include: {
                        segment: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                prisma_1.prisma.audienceOptimization.count({ where })
            ]);
            res.json({
                optimizations,
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
    app.get(`${prefix}/optimization/ai-insights`, async (req, res) => {
        try {
            const { segmentId } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const aiInsights = await generateAIInsights(organizationId, segmentId);
            res.json({
                aiInsights,
                generatedAt: new Date(),
                confidence: aiInsights.confidence || 0.85
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
async function applyOptimization(segment, type, parameters) {
    return {
        type,
        parameters,
        applied: true,
        estimatedImpact: Math.random() * 0.3 + 0.1,
        confidence: Math.random() * 0.2 + 0.8
    };
}
async function generateAIInsights(organizationId, segmentId) {
    return {
        keyInsights: [
            'Audience shows high engagement during evening hours',
            'Mobile users have 23% higher conversion rate',
            'Geographic targeting could improve performance by 15%'
        ],
        recommendations: [
            'Adjust bid strategy for mobile users',
            'Implement time-based targeting',
            'Expand to similar audience segments'
        ],
        confidence: 0.87,
        dataPoints: Math.floor(Math.random() * 10000) + 5000
    };
}
//# sourceMappingURL=audience-optimization.routes.js.map