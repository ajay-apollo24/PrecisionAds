"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAudienceInsightsRoutes = setupAudienceInsightsRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupAudienceInsightsRoutes(app, prefix) {
    app.get(`${prefix}/insights`, async (req, res) => {
        try {
            const { startDate, endDate, segmentId, metric } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = { organizationId };
            if (startDate && endDate) {
                where.date = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            if (segmentId) {
                where.segmentId = segmentId;
            }
            const demographicInsights = await prisma_1.prisma.audienceDemographics.findMany({
                where,
                orderBy: { date: 'desc' },
                take: 30
            });
            const behavioralInsights = await prisma_1.prisma.audienceBehavior.findMany({
                where,
                orderBy: { date: 'desc' },
                take: 30
            });
            const engagementInsights = await prisma_1.prisma.audienceEngagement.findMany({
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
                    averageEngagementRate: engagementInsights.reduce((sum, insight) => sum + insight.engagementRate, 0) / engagementInsights.length,
                    topBehaviors: behavioralInsights.slice(0, 5)
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
    app.get(`${prefix}/insights/realtime`, async (req, res) => {
        try {
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const activeUsers = await prisma_1.prisma.audienceRealtimeData.findMany({
                where: {
                    organizationId,
                    isActive: true
                },
                orderBy: { lastActivity: 'desc' },
                take: 100
            });
            const recentEvents = await prisma_1.prisma.audienceEvent.findMany({
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
    app.get(`${prefix}/insights/overlap`, async (req, res) => {
        try {
            const { segmentIds } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!segmentIds) {
                throw (0, error_handler_1.createError)('Segment IDs required', 400);
            }
            const segmentIdArray = segmentIds.split(',');
            const overlapData = await prisma_1.prisma.audienceSegmentOverlap.findMany({
                where: {
                    organizationId,
                    segmentId: { in: segmentIdArray }
                }
            });
            const overlapMatrix = segmentIdArray.map(id1 => segmentIdArray.map(id2 => {
                const overlap = overlapData.find(o => (o.segmentId1 === id1 && o.segmentId2 === id2) ||
                    (o.segmentId1 === id2 && o.segmentId2 === id1));
                return overlap ? overlap.overlapPercentage : 0;
            }));
            res.json({
                segmentIds: segmentIdArray,
                overlapMatrix,
                overlapData
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
//# sourceMappingURL=audience-insights.routes.js.map