import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupPredictiveBiddingRoutes(app: Express, prefix: string): void {
  // Get predictive bidding models
  app.get(`${prefix}/predictive-bidding/models`, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, status, type } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

      if (status) {
        where.status = status;
      }

      if (type) {
        where.type = type;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [models, total] = await Promise.all([
        prisma.predictiveBiddingModel.findMany({
          where,
          include: {
            performance: true,
            trainingData: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.predictiveBiddingModel.count({ where })
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Create predictive bidding model
  app.post(`${prefix}/predictive-bidding/models`, async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        type,
        algorithm,
        parameters,
        trainingData,
        targetMetrics
      } = req.body;

      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!name || !type || !algorithm) {
        throw createError('Name, type, and algorithm are required', 400);
      }

      const model = await prisma.predictiveBiddingModel.create({
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Train predictive bidding model
  app.post(`${prefix}/predictive-bidding/models/:id/train`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { trainingData, parameters } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const model = await prisma.predictiveBiddingModel.findFirst({
        where: { 
          id,
          organizationId 
        }
      });

      if (!model) {
        throw createError('Predictive bidding model not found', 404);
      }

      // Simulate model training (placeholder)
      const trainingResult = await trainModel(model, trainingData, parameters);

      // Update model with training results
      const updatedModel = await prisma.predictiveBiddingModel.update({
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get bid predictions
  app.post(`${prefix}/predictive-bidding/predict`, async (req: Request, res: Response) => {
    try {
      const { modelId, auctionData, context } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!modelId || !auctionData) {
        throw createError('Model ID and auction data are required', 400);
      }

      const model = await prisma.predictiveBiddingModel.findFirst({
        where: { 
          id: modelId,
          organizationId 
        }
      });

      if (!model) {
        throw createError('Predictive bidding model not found', 404);
      }

      if (model.status !== 'ACTIVE') {
        throw createError('Model is not active', 400);
      }

      // Generate bid prediction (placeholder)
      const prediction = await generateBidPrediction(model, auctionData, context);

      // Log prediction for analysis
      await prisma.bidPrediction.create({
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get model performance analytics
  app.get(`${prefix}/predictive-bidding/models/:id/performance`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { 
        modelId: id,
        organizationId 
      };

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      const performance = await prisma.predictiveBiddingPerformance.findMany({
        where,
        orderBy: { date: 'desc' }
      });

      // Calculate model performance metrics
      const metrics = performance.reduce((acc: any, perf: any) => ({
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
}

import { PredictiveBiddingService } from '../services/predictive-bidding.service';

const predictiveBiddingService = new PredictiveBiddingService();

// Helper functions for predictive bidding
async function trainModel(model: any, trainingData: any, parameters: any): Promise<any> {
  try {
    const result = await predictiveBiddingService.trainModel(
      model.id,
      model.organizationId,
      trainingData,
      parameters
    );
    return result;
  } catch (error) {
    console.error('Error training model:', error);
    return {
      accuracy: 0,
      trainingTime: 0,
      epochs: 0,
      loss: 1,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function generateBidPrediction(model: any, auctionData: any, context: any): Promise<any> {
  try {
    const result = await predictiveBiddingService.predictBid(
      model.id,
      model.organizationId,
      auctionData,
      context
    );
    return result;
  } catch (error) {
    console.error('Error generating bid prediction:', error);
    return {
      recommendedBid: auctionData.floorPrice || 1.0,
      confidence: 0.5,
      factors: {},
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 