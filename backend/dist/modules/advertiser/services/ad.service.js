"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class AdService {
    async getAds(campaignId, organizationId, filters = {}) {
        const where = { campaignId, organizationId };
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.creativeType) {
            where.creativeType = filters.creativeType;
        }
        return prisma_1.prisma.advertiserAd.findMany({
            where,
            include: {
                campaign: {
                    select: { id: true, name: true, status: true, type: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getAdById(id, organizationId) {
        return prisma_1.prisma.advertiserAd.findFirst({
            where: { id, organizationId },
            include: {
                campaign: {
                    select: { id: true, name: true, status: true, type: true }
                }
            }
        });
    }
    async createAd(data, organizationId) {
        return prisma_1.prisma.advertiserAd.create({
            data: {
                ...data,
                organizationId,
                status: 'DRAFT'
            },
            include: {
                campaign: {
                    select: { id: true, name: true, status: true, type: true }
                }
            }
        });
    }
    async updateAd(id, data, organizationId) {
        return prisma_1.prisma.advertiserAd.update({
            where: { id, organizationId },
            data: {
                ...data,
                updatedAt: new Date()
            },
            include: {
                campaign: {
                    select: { id: true, name: true, status: true, type: true }
                }
            }
        });
    }
    async deleteAd(id, organizationId) {
        return prisma_1.prisma.advertiserAd.update({
            where: { id, organizationId },
            data: {
                status: 'REJECTED',
                updatedAt: new Date()
            },
            include: {
                campaign: {
                    select: { id: true, name: true, status: true, type: true }
                }
            }
        });
    }
    async getAdStats(adId, organizationId, startDate, endDate) {
        const where = {
            id: adId,
            organizationId
        };
        const ad = await prisma_1.prisma.advertiserAd.findFirst({
            where,
            select: {
                impressions: true,
                clicks: true,
                conversions: true,
                ctr: true,
                cpc: true,
                cpm: true
            }
        });
        if (!ad) {
            throw new Error('Ad not found');
        }
        return {
            totalImpressions: ad.impressions || 0,
            totalClicks: ad.clicks || 0,
            totalConversions: ad.conversions || 0,
            ctr: ad.ctr || 0,
            cpc: ad.cpc || 0,
            cpm: ad.cpm || 0,
            conversionRate: ad.clicks && ad.clicks > 0 ? (ad.conversions || 0) / ad.clicks * 100 : 0
        };
    }
    async getTopPerformingAds(campaignId, organizationId, limit = 5) {
        const ads = await prisma_1.prisma.advertiserAd.findMany({
            where: { campaignId, organizationId, status: 'ACTIVE' },
            include: {
                campaign: {
                    select: { id: true, name: true, status: true, type: true }
                }
            }
        });
        const adsWithScore = ads.map((ad) => {
            const impressions = ad.impressions || 0;
            const clicks = ad.clicks || 0;
            const conversions = ad.conversions || 0;
            const ctrScore = impressions > 0 ? (clicks / impressions) * 100 : 0;
            const conversionScore = clicks > 0 ? (conversions / clicks) * 100 : 0;
            const performanceScore = (ctrScore * 0.6) + (conversionScore * 0.4);
            return {
                ...ad,
                performanceScore
            };
        });
        return adsWithScore
            .sort((a, b) => b.performanceScore - a.performanceScore)
            .slice(0, limit);
    }
    validateAdData(data) {
        const errors = [];
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Ad name is required');
        }
        if (!data.creativeUrl || data.creativeUrl.trim().length === 0) {
            errors.push('Creative URL is required');
        }
        if (!data.landingPageUrl || data.landingPageUrl.trim().length === 0) {
            errors.push('Landing page URL is required');
        }
        if (data.weight && (data.weight < 1 || data.weight > 100)) {
            errors.push('Weight must be between 1 and 100');
        }
        try {
            new URL(data.creativeUrl);
        }
        catch {
            errors.push('Creative URL must be a valid URL');
        }
        try {
            new URL(data.landingPageUrl);
        }
        catch {
            errors.push('Landing page URL must be a valid URL');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.AdService = AdService;
//# sourceMappingURL=ad.service.js.map