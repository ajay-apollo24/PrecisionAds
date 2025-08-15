"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPredictiveBiddingRoutes = setupPredictiveBiddingRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupPredictiveBiddingRoutes(app, prefix) {
    app.get(`${prefix}/predictive-bidding/models`, async (req, res) => {
        try {
            const { page = 1, limit = 50, status, type } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = { organizationId };
            if (status) {
                where.status = status;
            }
            if (type) {
                where.type = type;
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [models, total] = await Promise.all([
                prisma_1.prisma.predictiveBiddingModel.findMany({
                    where,
                    include: {
                        performance: true,
                        trainingData: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                prisma_1.prisma.predictiveBiddingModel.count({ where })
            ]);
            res.json({
                models,
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
    app.post(`${prefix}/predictive-bidding/models`, async (req, res) => {
        try {
            const { name, description, type, algorithm, parameters, trainingData, targetMetrics } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!name || !type || !algorithm) {
                throw (0, error_handler_1.createError)('Name, type, and algorithm are required', 400);
            }
            const model = await prisma_1.prisma.predictiveBiddingModel.create({
                data: {
                    organizationId,
                    name,
                    description,
                    type,
                    algorithm,
                    parameters: parameters || {},
                    trainingData: trainingData || {},
                    targetMetrics: targetMetrics || {},
                    status: 'TRAINING',
                    accuracy: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            res.status(201).json({
                message: 'Predictive bidding model created successfully',
                model
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
    app.post(`${prefix}/predictive-bidding/models/:id/train`, async (req, res) => {
        try {
            const { id } = req.params;
            const { trainingData, parameters } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const model = await prisma_1.prisma.predictiveBiddingModel.findFirst({
                where: {
                    id,
                    organizationId
                }
            });
            if (!model) {
                throw (0, error_handler_1.createError)('Predictive bidding model not found', 404);
            }
            const trainingResult = await trainModel(model, trainingData, parameters);
            const updatedModel = await prisma_1.prisma.predictiveBiddingModel.update({
                where: { id },
                data: {
                    status: 'ACTIVE',
                    accuracy: trainingResult.accuracy,
                    lastTrainedAt: new Date(),
                    updatedAt: new Date()
                }
            });
            res.json({
                message: 'Model training completed successfully',
                model: updatedModel,
                trainingResult
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
    app.post(`${prefix}/predictive-bidding/predict`, async (req, res) => {
        try {
            const { modelId, auctionData, context } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!modelId || !auctionData) {
                throw (0, error_handler_1.createError)('Model ID and auction data are required', 400);
            }
            const model = await prisma_1.prisma.predictiveBiddingModel.findFirst({
                where: {
                    id: modelId,
                    organizationId
                }
            });
            if (!model) {
                throw (0, error_handler_1.createError)('Predictive bidding model not found', 404);
            }
            if (model.status !== 'ACTIVE') {
                throw (0, error_handler_1.createError)('Model is not active', 400);
            }
            const prediction = await generateBidPrediction(model, auctionData, context);
            await prisma_1.prisma.bidPrediction.create({
                data: {
                    organizationId,
                    modelId,
                    auctionData,
                    context,
                    prediction,
                    timestamp: new Date()
                }
            });
            res.json({
                prediction,
                model,
                confidence: prediction.confidence,
                recommendedBid: prediction.recommendedBid
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
    app.get(`${prefix}/predictive-bidding/models/:id/performance`, async (req, res) => {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = {
                modelId: id,
                organizationId
            };
            if (startDate && endDate) {
                where.date = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            const performance = await prisma_1.prisma.predictiveBiddingPerformance.findMany({
                where,
                orderBy: { date: 'desc' }
            });
            const metrics = performance.reduce((acc, perf) => ({
                totalPredictions: acc.totalPredictions + perf.predictions,
                accuratePredictions: acc.accuratePredictions + perf.accuratePredictions,
                totalRevenue: acc.totalRevenue + Number(perf.revenue),
                totalSpend: acc.totalSpend + Number(perf.spend)
            }), { totalPredictions: 0, accuratePredictions: 0, totalRevenue: 0, totalSpend: 0 });
            res.json({
                performance,
                metrics: {
                    ...metrics,
                    accuracy: metrics.totalPredictions > 0 ? (metrics.accuratePredictions / metrics.totalPredictions) * 100 : 0,
                    roas: metrics.totalSpend > 0 ? metrics.totalRevenue / metrics.totalSpend : 0
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
async function trainModel(model, trainingData, parameters) {
    return {
        accuracy: Math.random() * 0.3 + 0.7,
        trainingTime: Math.floor(Math.random() * 300) + 60,
        epochs: Math.floor(Math.random() * 50) + 100,
        loss: Math.random() * 0.1
    };
}
async function generateBidPrediction(model, auctionData, context) {
    const baseBid = auctionData.floorPrice || 1.0;
    const multiplier = Math.random() * 0.5 + 0.8;
    return {
        recommendedBid: baseBid * multiplier,
        confidence: Math.random() * 0.3 + 0.7,
        factors: {
            userValue: Math.random() * 0.4 + 0.6,
            contextRelevance: Math.random() * 0.3 + 0.7,
            historicalPerformance: Math.random() * 0.2 + 0.8
        }
    };
}
//# sourceMappingURL=predictive-bidding.routes.js.map