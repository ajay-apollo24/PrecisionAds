"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class CampaignService {
    async getCampaigns(organizationId, filters = {}) {
        const where = { organizationId };
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.type) {
            where.type = filters.type;
        }
        if (filters.startDate && filters.endDate) {
            where.startDate = {
                gte: filters.startDate,
                lte: filters.endDate
            };
        }
        return prisma_1.prisma.advertiserCampaign.findMany({
            where,
            include: {
                ads: {
                    where: { status: 'ACTIVE' },
                    select: { id: true, name: true, creativeType: true, status: true }
                },
                audiences: {
                    select: { id: true, name: true, description: true, size: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getCampaignById(id, organizationId) {
        return prisma_1.prisma.advertiserCampaign.findFirst({
            where: { id, organizationId },
            include: {
                ads: true,
                audiences: true
            }
        });
    }
    async createCampaign(data, organizationId) {
        return prisma_1.prisma.advertiserCampaign.create({
            data: {
                ...data,
                organizationId,
                status: 'DRAFT'
            },
            include: {
                ads: [],
                audiences: []
            }
        });
    }
    async updateCampaign(id, data, organizationId) {
        return prisma_1.prisma.advertiserCampaign.update({
            where: { id, organizationId },
            data: {
                ...data,
                updatedAt: new Date()
            },
            include: {
                ads: true,
                audiences: true
            }
        });
    }
    async deleteCampaign(id, organizationId) {
        return prisma_1.prisma.advertiserCampaign.update({
            where: { id, organizationId },
            data: {
                status: 'CANCELLED',
                updatedAt: new Date()
            },
            include: {
                ads: true,
                audiences: true
            }
        });
    }
    async getCampaignStats(campaignId, organizationId, startDate, endDate) {
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
        const [ads, totalSpent, totalImpressions, totalClicks, totalConversions] = await Promise.all([
            prisma_1.prisma.advertiserAd.count({ where: { campaignId, organizationId } }),
            prisma_1.prisma.advertiserCampaign.findUnique({
                where: { id: campaignId, organizationId },
                select: { totalSpent: true }
            }),
            prisma_1.prisma.advertiserCampaign.findUnique({
                where: { id: campaignId, organizationId },
                select: { impressions: true }
            }),
            prisma_1.prisma.advertiserCampaign.findUnique({
                where: { id: campaignId, organizationId },
                select: { clicks: true }
            }),
            prisma_1.prisma.advertiserCampaign.findUnique({
                where: { id: campaignId, organizationId },
                select: { conversions: true }
            })
        ]);
        const spent = totalSpent?.totalSpent || 0;
        const impressions = totalImpressions?.impressions || 0;
        const clicks = totalClicks?.clicks || 0;
        const conversions = totalConversions?.conversions || 0;
        return {
            totalAds: ads,
            totalSpent: spent,
            totalImpressions: impressions,
            totalClicks: clicks,
            totalConversions: conversions,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
            cpm: impressions > 0 ? (Number(spent) / impressions) * 1000 : 0,
            cpc: clicks > 0 ? Number(spent) / clicks : 0,
            cpa: conversions > 0 ? Number(spent) / conversions : 0
        };
    }
    async getTopPerformingCampaigns(organizationId, limit = 5) {
        const campaigns = await prisma_1.prisma.advertiserCampaign.findMany({
            where: { organizationId, status: 'ACTIVE' },
            include: {
                ads: {
                    where: { status: 'ACTIVE' },
                    select: { id: true, name: true, creativeType: true }
                },
                audiences: {
                    select: { id: true, name: true, size: true }
                }
            }
        });
        const campaignsWithScore = campaigns.map((campaign) => {
            const impressions = campaign.impressions || 0;
            const clicks = campaign.clicks || 0;
            const conversions = campaign.conversions || 0;
            const spent = Number(campaign.totalSpent) || 0;
            const engagementScore = impressions > 0 ? (clicks / impressions) * 100 : 0;
            const conversionScore = clicks > 0 ? (conversions / clicks) * 100 : 0;
            const efficiencyScore = spent > 0 ? (conversions / spent) * 100 : 0;
            const performanceScore = (engagementScore * 0.4) + (conversionScore * 0.4) + (efficiencyScore * 0.2);
            return {
                ...campaign,
                performanceScore
            };
        });
        return campaignsWithScore
            .sort((a, b) => b.performanceScore - a.performanceScore)
            .slice(0, limit);
    }
    validateCampaignData(data) {
        const errors = [];
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Campaign name is required');
        }
        if (data.budget && Number(data.budget) <= 0) {
            errors.push('Budget must be greater than 0');
        }
        if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
            errors.push('End date must be after start date');
        }
        if (data.dailyBudget && Number(data.dailyBudget) <= 0) {
            errors.push('Daily budget must be greater than 0');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.CampaignService = CampaignService;
//# sourceMappingURL=campaign.service.js.map