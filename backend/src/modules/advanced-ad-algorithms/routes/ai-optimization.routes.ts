import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupAIOptimizationRoutes(app: Express, prefix: string): void {
  // Get AI optimization campaigns
  app.get(`${prefix}/ai-optimization/campaigns`, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, status, optimizationType } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

      if (status) {
        where.status = status;
      }

      if (optimizationType) {
        where.optimizationType = optimizationType;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [campaigns, total] = await Promise.all([
        prisma.aIOptimizationCampaign.findMany({
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
        prisma.aIOptimizationCampaign.count({ where })
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Create AI optimization campaign
  app.post(`${prefix}/ai-optimization/campaigns`, async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        optimizationType,
        targetMetrics,
        constraints,
        budget,
        startDate,
        endDate
      } = req.body;

      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!name || !optimizationType || !targetMetrics) {
        throw createError('Name, optimization type, and target metrics are required', 400);
      }

      const campaign = await prisma.aIOptimizationCampaign.create({
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Start AI optimization
  app.post(`${prefix}/ai-optimization/campaigns/:id/start`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { parameters } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const campaign = await prisma.aiOptimizationCampaign.findFirst({
        where: { 
          id,
          organizationId 
        }
      });

      if (!campaign) {
        throw createError('AI optimization campaign not found', 404);
      }

      // Start optimization process (placeholder)
      const optimizationResult = await startOptimization(campaign, parameters);

      // Update campaign status
      const updatedCampaign = await prisma.aiOptimizationCampaign.update({
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get optimization recommendations
  app.get(`${prefix}/ai-optimization/recommendations`, async (req: Request, res: Response) => {
    try {
      const { campaignId, type, limit = 10 } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

      if (campaignId) {
        where.campaignId = campaignId;
      }

      if (type) {
        where.type = type;
      }

      const recommendations = await prisma.aiOptimizationRecommendation.findMany({
        where,
        include: {
          campaign: true,
          impact: true
        },
        orderBy: { confidence: 'desc' },
        take: Number(limit)
      });

      // Group recommendations by category
      const groupedRecommendations = recommendations.reduce((acc: any, rec: any) => {
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
          highImpact: recommendations.filter((r: any) => r.impact > 0.1).length,
          mediumImpact: recommendations.filter((r: any) => r.impact > 0.05 && r.impact <= 0.1).length,
          lowImpact: recommendations.filter((r: any) => r.impact <= 0.05).length
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

  // Apply optimization recommendation
  app.post(`${prefix}/ai-optimization/recommendations/:id/apply`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { parameters } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const recommendation = await prisma.aiOptimizationRecommendation.findFirst({
        where: { 
          id,
          organizationId 
        }
      });

      if (!recommendation) {
        throw createError('Optimization recommendation not found', 404);
      }

      // Apply the recommendation (placeholder)
      const applicationResult = await applyRecommendation(recommendation, parameters);

      // Create application record
      const application = await prisma.optimizationApplication.create({
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get AI model insights
  app.get(`${prefix}/ai-optimization/insights`, async (req: Request, res: Response) => {
    try {
      const { campaignId, modelId, startDate, endDate } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

      if (campaignId) {
        where.campaignId = campaignId;
      }

      if (modelId) {
        where.modelId = modelId;
      }

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      const insights = await prisma.aiModelInsight.findMany({
        where,
        orderBy: { date: 'desc' }
      });

      // Generate AI-powered insights (placeholder)
      const aiInsights = await generateAIInsights(insights);

      res.json({
        insights,
        aiInsights,
        summary: {
          totalInsights: insights.length,
          modelAccuracy: insights.reduce((sum: number, insight: any) => sum + insight.accuracy, 0) / insights.length,
          optimizationImpact: aiInsights.estimatedImpact
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

  // Execute AI optimization campaign
  app.post(`${prefix}/ai-optimization/campaigns/:campaignId/execute`, async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const { optimizationType, parameters } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!optimizationType) {
        throw createError('Optimization type is required', 400);
      }

      // Execute AI optimization using the service
      const result = await aiOptimizationService.startOptimization(
        campaignId,
        organizationId,
        optimizationType,
        parameters || {}
      );

      res.json({
        message: 'AI optimization started successfully',
        ...result
      });
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get AI optimization status
  app.get(`${prefix}/ai-optimization/campaigns/:campaignId/status`, async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      // Get optimization status using the service
      const campaign = await prisma.aIOptimizationCampaign.findFirst({
        where: { id: campaignId, organizationId }
      });

      if (!campaign) {
        throw createError('AI optimization campaign not found', 404);
      }

      res.json({
        message: 'AI optimization status retrieved successfully',
        campaign,
        status: campaign.status,
        lastUpdated: campaign.updatedAt
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

import { AIOptimizationService } from '../services/ai-optimization.service';

const aiOptimizationService = new AIOptimizationService();

// Helper functions for AI optimization
async function startOptimization(campaign: any, parameters: any): Promise<any> {
  try {
    const result = await aiOptimizationService.startOptimization(
      campaign.id,
      campaign.organizationId,
      parameters.optimizationType || 'PERFORMANCE',
      parameters
    );
    return result;
  } catch (error) {
    console.error('Error starting optimization:', error);
    return {
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function applyRecommendation(recommendation: any, parameters: any): Promise<any> {
  try {
    // Apply the recommendation using the service
    const result = await aiOptimizationService.applyRecommendation(
      recommendation.id,
      recommendation.organizationId,
      parameters
    );
    return result;
  } catch (error) {
    console.error('Error applying recommendation:', error);
    return {
      applied: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function generateAIInsights(insights: any[]): Promise<any> {
  try {
    // Generate insights using the service
    const result = await aiOptimizationService.generateInsights(insights);
    return result;
  } catch (error) {
    console.error('Error generating insights:', error);
    return {
      keyPatterns: [],
      recommendations: [],
      estimatedImpact: 0,
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 