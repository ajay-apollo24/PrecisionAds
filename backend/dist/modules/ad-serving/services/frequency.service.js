"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrequencyService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class FrequencyService {
    async checkFrequencyCap(userId, adId, campaignId, organizationId, eventType = 'impression') {
        try {
            const campaign = await prisma_1.prisma.advertiserCampaign.findFirst({
                where: { id: campaignId, organizationId }
            });
            if (!campaign) {
                throw new Error('Campaign not found');
            }
            const frequencyCaps = {
                impression: { limit: 3, window: 'day' },
                click: { limit: 1, window: 'day' }
            };
            const cap = frequencyCaps[eventType];
            if (!cap) {
                return {
                    allowed: true,
                    reason: 'No frequency cap set for this event type',
                    currentCount: 0,
                    limit: 0,
                    timeRemaining: 0
                };
            }
            const currentCount = await this.getCurrentFrequencyCount(userId, adId, campaignId, organizationId, eventType, cap.window);
            const allowed = currentCount < cap.limit;
            const timeRemaining = this.calculateTimeRemaining(cap.window);
            return {
                allowed,
                reason: allowed ? 'Frequency cap not exceeded' : 'Frequency cap exceeded',
                currentCount,
                limit: cap.limit,
                timeRemaining
            };
        }
        catch (error) {
            throw new Error(`Frequency cap check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async recordFrequencyEvent(userId, adId, campaignId, organizationId, eventType) {
        try {
            const campaign = await prisma_1.prisma.advertiserCampaign.findFirst({
                where: { id: campaignId, organizationId }
            });
            if (!campaign) {
                throw new Error('Campaign not found');
            }
            const frequencyCaps = {
                impression: { limit: 3, window: 'day' },
                click: { limit: 1, window: 'day' }
            };
            const cap = frequencyCaps[eventType];
            if (!cap) {
                return;
            }
            const { windowStart, windowEnd } = this.calculateTimeWindow(cap.window);
            await prisma_1.prisma.frequencyCap.upsert({
                where: {
                    id: `${userId}-${adId}-${eventType}-${windowStart.getTime()}`
                },
                update: {
                    count: {
                        increment: 1
                    }
                },
                create: {
                    organizationId,
                    campaignId,
                    adId,
                    userId,
                    eventType,
                    count: 1,
                    windowStart,
                    windowEnd
                }
            });
        }
        catch (error) {
            throw new Error(`Failed to record frequency event: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getCurrentFrequencyCount(userId, adId, campaignId, organizationId, eventType, window) {
        const { windowStart, windowEnd } = this.calculateTimeWindow(window);
        const frequencyCap = await prisma_1.prisma.frequencyCap.findFirst({
            where: {
                userId,
                adId,
                campaignId,
                organizationId,
                eventType,
                windowStart: {
                    gte: windowStart
                },
                windowEnd: {
                    lte: windowEnd
                }
            },
            select: { count: true }
        });
        return frequencyCap?.count || 0;
    }
    calculateTimeWindow(window) {
        const now = new Date();
        let windowStart;
        let windowEnd;
        switch (window) {
            case 'hour':
                windowStart = new Date(now.getTime() - 60 * 60 * 1000);
                windowEnd = new Date(now.getTime() + 60 * 60 * 1000);
                break;
            case 'day':
                windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                break;
            case 'week':
                windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                windowEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }
        return { windowStart, windowEnd };
    }
    calculateTimeRemaining(window) {
        const now = new Date();
        let windowEnd;
        switch (window) {
            case 'hour':
                windowEnd = new Date(now.getTime() + 60 * 60 * 1000);
                break;
            case 'day':
                windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                break;
            case 'week':
                windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                windowEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }
        return Math.max(0, windowEnd.getTime() - now.getTime());
    }
    async getFrequencyAnalytics(campaignId, organizationId, startDate, endDate) {
        try {
            const where = {
                campaignId,
                organizationId
            };
            if (startDate && endDate) {
                where.createdAt = {
                    gte: startDate,
                    lte: endDate
                };
            }
            const frequencyCaps = await prisma_1.prisma.frequencyCap.findMany({
                where,
                select: {
                    userId: true,
                    eventType: true,
                    count: true,
                    createdAt: true
                }
            });
            const totalEvents = frequencyCaps.reduce((sum, fc) => sum + fc.count, 0);
            const uniqueUsers = new Set(frequencyCaps.map(fc => fc.userId)).size;
            const averageEventsPerUser = uniqueUsers > 0 ? totalEvents / uniqueUsers : 0;
            const userEventCounts = new Map();
            frequencyCaps.forEach(fc => {
                const current = userEventCounts.get(fc.userId) || 0;
                userEventCounts.set(fc.userId, current + fc.count);
            });
            const topUsers = Array.from(userEventCounts.entries())
                .map(([userId, eventCount]) => ({ userId, eventCount }))
                .sort((a, b) => b.eventCount - a.eventCount)
                .slice(0, 10);
            const eventBreakdown = {};
            frequencyCaps.forEach(fc => {
                eventBreakdown[fc.eventType] = (eventBreakdown[fc.eventType] || 0) + fc.count;
            });
            return {
                totalEvents,
                uniqueUsers,
                averageEventsPerUser,
                topUsers,
                eventBreakdown
            };
        }
        catch (error) {
            throw new Error(`Failed to get frequency analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async resetFrequencyCaps(userId, campaignId, organizationId) {
        try {
            await prisma_1.prisma.frequencyCap.deleteMany({
                where: {
                    userId,
                    campaignId,
                    organizationId
                }
            });
        }
        catch (error) {
            throw new Error(`Failed to reset frequency caps: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getRecommendedFrequencyCaps(campaignId, organizationId) {
        try {
            const campaign = await prisma_1.prisma.advertiserCampaign.findFirst({
                where: { id: campaignId, organizationId },
                select: {
                    impressions: true,
                    clicks: true,
                    conversions: true,
                    totalSpent: true
                }
            });
            if (!campaign) {
                throw new Error('Campaign not found');
            }
            const ctr = campaign.impressions > 0 ? campaign.clicks / campaign.impressions : 0;
            const conversionRate = campaign.clicks > 0 ? campaign.conversions / campaign.clicks : 0;
            const cpm = campaign.impressions > 0 ? (Number(campaign.totalSpent) / campaign.impressions) * 1000 : 0;
            let impressionLimit = 3;
            let clickLimit = 1;
            let reasoning = '';
            if (ctr > 0.05) {
                impressionLimit = 5;
                reasoning = 'High CTR suggests good ad relevance, allowing more impressions';
            }
            else if (ctr < 0.01) {
                impressionLimit = 2;
                reasoning = 'Low CTR suggests poor ad relevance, limiting impressions';
            }
            if (conversionRate > 0.02) {
                clickLimit = 2;
                reasoning += '. High conversion rate suggests good landing page, allowing more clicks';
            }
            else if (conversionRate < 0.005) {
                clickLimit = 1;
                reasoning += '. Low conversion rate suggests poor landing page, limiting clicks';
            }
            return {
                impression: { limit: impressionLimit, window: 'day' },
                click: { limit: clickLimit, window: 'day' },
                reasoning: reasoning || 'Standard frequency caps based on campaign performance'
            };
        }
        catch (error) {
            throw new Error(`Failed to get recommended frequency caps: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.FrequencyService = FrequencyService;
//# sourceMappingURL=frequency.service.js.map