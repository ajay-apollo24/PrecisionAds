import { Express, Request, Response } from 'express';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export function setupAudienceInsightsRoutes(app: Express, prefix: string): void {
  // Get audience insights and analytics
  app.get(`${prefix}/insights`, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, segmentId, metric } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const where: any = { organizationId };

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      if (segmentId) {
        where.segmentId = segmentId;
      }

      // Get demographic insights
      const demographicInsights = await prisma.audienceDemographics.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 30
      });

      // Get behavioral insights
      const behavioralInsights = await prisma.audienceBehavior.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 30
      });

      // Get engagement insights
      const engagementInsights = await prisma.audienceEngagement.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 30
      });

      res.json({
        demographicInsights,
        behavioralInsights,
        engagementInsights,
        summary: {
          totalAudienceSize: demographicInsights.reduce((sum, insight) => sum + insight.audienceSize, 0),
          averageEngagementRate: engagementInsights.reduce((sum, insight) => sum + Number(insight.engagementRate), 0) / engagementInsights.length,
          topBehaviors: behavioralInsights.slice(0, 5)
        }
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get real-time audience data
  app.get(`${prefix}/insights/realtime`, async (req: Request, res: Response) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      // Get current active users
      const activeUsers = await prisma.audienceRealtimeData.findMany({
        where: { 
          organizationId,
          isActive: true 
        },
        orderBy: { lastActivity: 'desc' },
        take: 100
      });

      // Get recent audience events
      const recentEvents = await prisma.audienceEvent.findMany({
        where: { organizationId },
        orderBy: { timestamp: 'desc' },
        take: 50
      });

      res.json({
        activeUsers: activeUsers.length,
        recentEvents,
        realtimeMetrics: {
          currentEngagement: activeUsers.filter(u => u.isEngaged).length,
          averageSessionDuration: activeUsers.reduce((sum, user) => sum + user.sessionDuration, 0) / activeUsers.length
        }
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get audience overlap analysis
  app.get(`${prefix}/insights/overlap`, async (req: Request, res: Response) => {
    try {
      const { segmentIds } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!segmentIds) {
        throw createError('Segment IDs required', 400);
      }

      const segmentIdArray = (segmentIds as string).split(',');
      
      // Calculate overlap between segments
      const overlapData = await prisma.audienceSegmentOverlap.findMany({
        where: {
          organizationId,
          segmentId1: { in: segmentIdArray }
        }
      });

      // Calculate overlap percentages
      const overlapMatrix = segmentIdArray.map(id1 => 
        segmentIdArray.map(id2 => {
          const overlap = overlapData.find(o => 
            (o.segmentId1 === id1 && o.segmentId2 === id2) ||
            (o.segmentId1 === id2 && o.segmentId2 === id1)
          );
          return overlap ? overlap.overlapPercentage : 0;
        })
      );

      res.json({
        segmentIds: segmentIdArray,
        overlapMatrix,
        overlapData
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
} 