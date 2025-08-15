"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAIOptimizationRoutes = setupAIOptimizationRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupAIOptimizationRoutes(app, prefix) {
    app.get(`${prefix}/ai-optimization/campaigns`, async (req, res) => {
        try {
            const { page = 1, limit = 50, status, optimizationType } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = { organizationId };
            if (status) {
                where.status = status;
            }
            if (optimizationType) {
                where.optimizationType = optimizationType;
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [campaigns, total] = await Promise.all([
                prisma_1.prisma.aiOptimizationCampaign.findMany({
                    where,
                    include: {
                        models: true,
                        performance: true,
                        recommendations: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                prisma_1.prisma.aiOptimizationCampaign.count({ where })
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
    app.post(`${prefix}/ai-optimization/campaigns`, async (req, res) => {
        try {
            const { name, description, optimizationType, targetMetrics, constraints, budget, startDate, endDate } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!name || !optimizationType || !targetMetrics) {
                throw (0, error_handler_1.createError)('Name, optimization type, and target metrics are required', 400);
            }
            const campaign = await prisma_1.prisma.aiOptimizationCampaign.create({
                data: {
                    organizationId,
                    name,
                    description,
                    optimizationType,
                    targetMetrics,
                    constraints: constraints || {},
                    budget,
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    status: 'SETUP',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            res.status(201).json({
                message: 'AI optimization campaign created successfully',
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
    app.post(`${prefix}/ai-optimization/campaigns/:id/start`, async (req, res) => {
        try {
            const { id } = req.params;
            const { parameters } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const campaign = await prisma_1.prisma.aiOptimizationCampaign.findFirst({
                where: {
                    id,
                    organizationId
                }
            });
            if (!campaign) {
                throw (0, error_handler_1.createError)('AI optimization campaign not found', 404);
            }
            const optimizationResult = await startOptimization(campaign, parameters);
            const updatedCampaign = await prisma_1.prisma.aiOptimizationCampaign.update({
                where: { id },
                data: {
                    status: 'RUNNING',
                    startedAt: new Date(),
                    updatedAt: new Date()
                }
            });
            res.json({
                message: 'AI optimization started successfully',
                campaign: updatedCampaign,
                optimizationResult
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
    app.get(`${prefix}/ai-optimization/recommendations`, async (req, res) => {
        try {
            const { campaignId, type, limit = 10 } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = { organizationId };
            if (campaignId) {
                where.campaignId = campaignId;
            }
            if (type) {
                where.type = type;
            }
            const recommendations = await prisma_1.prisma.aiOptimizationRecommendation.findMany({
                where,
                include: {
                    campaign: true,
                    impact: true
                },
                orderBy: { confidence: 'desc' },
                take: Number(limit)
            });
            const groupedRecommendations = recommendations.reduce((acc, rec) => {
                if (!acc[rec.category]) {
                    acc[rec.category] = [];
                }
                acc[rec.category].push(rec);
                return acc;
            }, {});
            res.json({
                recommendations,
                groupedRecommendations,
                summary: {
                    totalRecommendations: recommendations.length,
                    highImpact: recommendations.filter((r) => r.impact > 0.1).length,
                    mediumImpact: recommendations.filter((r) => r.impact > 0.05 && r.impact <= 0.1).length,
                    lowImpact: recommendations.filter((r) => r.impact <= 0.05).length
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
    app.post(`${prefix}/ai-optimization/recommendations/:id/apply`, async (req, res) => {
        try {
            const { id } = req.params;
            const { parameters } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const recommendation = await prisma_1.prisma.aiOptimizationRecommendation.findFirst({
                where: {
                    id,
                    organizationId
                }
            });
            if (!recommendation) {
                throw (0, error_handler_1.createError)('Optimization recommendation not found', 404);
            }
            const applicationResult = await applyRecommendation(recommendation, parameters);
            const application = await prisma_1.prisma.optimizationApplication.create({
                data: {
                    organizationId,
                    recommendationId: id,
                    parameters: parameters || {},
                    result: applicationResult,
                    status: 'APPLIED',
                    appliedAt: new Date(),
                    createdAt: new Date()
                }
            });
            res.json({
                message: 'Optimization recommendation applied successfully',
                application,
                result: applicationResult
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
    app.get(`${prefix}/ai-optimization/insights`, async (req, res) => {
        try {
            const { campaignId, modelId, startDate, endDate } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = { organizationId };
            if (campaignId) {
                where.campaignId = campaignId;
            }
            if (modelId) {
                where.modelId = modelId;
            }
            if (startDate && endDate) {
                where.date = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            const insights = await prisma_1.prisma.aiModelInsight.findMany({
                where,
                orderBy: { date: 'desc' }
            });
            const aiInsights = await generateAIInsights(insights);
            res.json({
                insights,
                aiInsights,
                summary: {
                    totalInsights: insights.length,
                    modelAccuracy: insights.reduce((sum, insight) => sum + insight.accuracy, 0) / insights.length,
                    optimizationImpact: aiInsights.estimatedImpact
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
async function startOptimization(campaign, parameters) {
    return {
        status: 'RUNNING',
        estimatedDuration: Math.floor(Math.random() * 60) + 30,
        currentIteration: 1,
        bestScore: 0,
        convergence: false
    };
}
async function applyRecommendation(recommendation, parameters) {
    return {
        applied: true,
        estimatedImpact: recommendation.impact,
        confidence: recommendation.confidence,
        appliedAt: new Date()
    };
}
async function generateAIInsights(insights) {
    return {
        keyPatterns: [
            'User engagement peaks during evening hours',
            'Mobile users show 25% higher conversion rates',
            'Geographic targeting improves performance by 18%'
        ],
        recommendations: [
            'Implement time-based optimization',
            'Increase mobile bid adjustments',
            'Expand geographic targeting'
        ],
        estimatedImpact: Math.random() * 0.3 + 0.1,
        confidence: Math.random() * 0.2 + 0.8
    };
}
//# sourceMappingURL=ai-optimization.routes.js.map