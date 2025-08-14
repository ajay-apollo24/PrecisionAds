import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupAudienceTargetingRoutes(app: Express, prefix: string): void {
  // Get targeting rules for an organization
  app.get(`${prefix}/targeting-rules`, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, type, status } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [rules, total] = await Promise.all([
        prisma.targetingRule.findMany({
          where,
          include: {
            conditions: true,
            performanceMetrics: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.targetingRule.count({ where })
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Create new targeting rule
  app.post(`${prefix}/targeting-rules`, async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        type,
        conditions,
        priority,
        status = 'DRAFT'
      } = req.body;

      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!name || !type || !conditions) {
        throw createError('Name, type, and conditions are required', 400);
      }

      const rule = await prisma.targetingRule.create({
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Test targeting rule against sample data
  app.post(`${prefix}/targeting-rules/:id/test`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { sampleData } = req.body;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!sampleData) {
        throw createError('Sample data required', 400);
      }

      const rule = await prisma.targetingRule.findFirst({
        where: { 
          id,
          organizationId 
        }
      });

      if (!rule) {
        throw createError('Targeting rule not found', 404);
      }

      // Simulate targeting logic
      const targetingResults = sampleData.map((data: any) => {
        const matches = evaluateTargetingRule(rule.conditions, data);
        return {
          data,
          matches,
          score: matches ? calculateTargetingScore(rule.conditions, data) : 0
        };
      });

      const summary = {
        totalSamples: targetingResults.length,
        matchingSamples: targetingResults.filter((r: any) => r.matches).length,
        averageScore: targetingResults.reduce((sum: number, r: any) => sum + r.score, 0) / targetingResults.length
      };

      res.json({
        rule,
        targetingResults,
        summary
      });
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get targeting performance analytics
  app.get(`${prefix}/targeting-rules/:id/performance`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { 
        targetingRuleId: id,
        organizationId 
      };

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      const performance = await prisma.targetingRulePerformance.findMany({
        where,
        orderBy: { date: 'desc' }
      });

      // Calculate targeting efficiency metrics
      const metrics = performance.reduce((acc: any, perf: any) => ({
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
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
}

// Helper functions for targeting logic
function evaluateTargetingRule(conditions: any, data: any): boolean {
  // Placeholder implementation - would contain actual targeting logic
  return Math.random() > 0.5; // Random for demo purposes
}

function calculateTargetingScore(conditions: any, data: any): number {
  // Placeholder implementation - would calculate actual targeting score
  return Math.random() * 100; // Random score for demo purposes
} 