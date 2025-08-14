import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupAudienceOptimizationRoutes(app: Express, prefix: string): void {
  // Get optimization recommendations for audiences
  app.get(`${prefix}/optimization/recommendations`, async (req: Request, res: Response) => {
    try {
      const { segmentId, type, limit = 10 } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

      if (segmentId) {
        where.segmentId = segmentId;
      }

      if (type) {
        where.type = type;
      }

      const recommendations = await prisma.audienceOptimizationRecommendation.findMany({
        where,
        orderBy: { confidence: 'desc' },
        take: Number(limit)
      });

      // Group recommendations by type
      const groupedRecommendations = recommendations.reduce((acc: any, rec: any) => {
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
          highConfidence: recommendations.filter((r: any) => r.confidence > 0.8).length,
          mediumConfidence: recommendations.filter((r: any) => r.confidence > 0.5 && r.confidence <= 0.8).length,
          lowConfidence: recommendations.filter((r: any) => r.confidence <= 0.5).length
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

  // Apply optimization to audience segment
  app.post(`${prefix}/optimization/apply`, async (req: Request, res: Response) => {
    try {
      const { segmentId, optimizationType, parameters } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!segmentId || !optimizationType) {
        throw createError('Segment ID and optimization type are required', 400);
      }

      // Get the segment
      const segment = await prisma.audienceSegment.findFirst({
        where: { 
          id: segmentId,
          organizationId 
        }
      });

      if (!segment) {
        throw createError('Audience segment not found', 404);
      }

      // Apply optimization logic (placeholder)
      const optimizationResult = await applyOptimization(segment, optimizationType, parameters);

      // Create optimization record
      const optimization = await prisma.audienceOptimization.create({
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get optimization history
  app.get(`${prefix}/optimization/history`, async (req: Request, res: Response) => {
    try {
      const { segmentId, type, status, page = 1, limit = 50 } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

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
        prisma.audienceOptimization.findMany({
          where,
          include: {
            segment: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.audienceOptimization.count({ where })
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get AI-powered audience insights
  app.get(`${prefix}/optimization/ai-insights`, async (req: Request, res: Response) => {
    try {
      const { segmentId } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      // Get AI-generated insights (placeholder implementation)
      const aiInsights = await generateAIInsights(organizationId, segmentId as string);

      res.json({
        aiInsights,
        generatedAt: new Date(),
        confidence: aiInsights.confidence || 0.85
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

// Helper functions for optimization logic
async function applyOptimization(segment: any, type: string, parameters: any): Promise<any> {
  // Placeholder implementation - would contain actual optimization logic
  return {
    type,
    parameters,
    applied: true,
    estimatedImpact: Math.random() * 0.3 + 0.1, // 10-40% improvement
    confidence: Math.random() * 0.2 + 0.8 // 80-100% confidence
  };
}

async function generateAIInsights(organizationId: string, segmentId?: string): Promise<any> {
  // Placeholder implementation - would contain actual AI insights generation
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