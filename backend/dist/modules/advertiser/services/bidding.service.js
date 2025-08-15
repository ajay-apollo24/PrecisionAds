"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiddingService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class BiddingService {
    async calculateOptimalBid(campaignId, organizationId, adUnitId, targetingScore = 0.5) {
        const campaign = await prisma_1.prisma.advertiserCampaign.findFirst({
            where: { id: campaignId, organizationId },
            select: {
                bidStrategy: true,
                targetCPM: true,
                targetCPC: true,
                targetCPA: true,
                budget: true,
                totalSpent: true
            }
        });
        if (!campaign) {
            throw new Error('Campaign not found');
        }
        const adUnit = await prisma_1.prisma.adUnit.findFirst({
            where: { id: adUnitId },
            select: { format: true, size: true }
        });
        if (!adUnit) {
            throw new Error('Ad unit not found');
        }
        const historicalData = await this.getHistoricalPerformance(campaignId, organizationId);
        let baseBid = this.calculateBaseBid(campaign, adUnit);
        let performanceMultiplier = this.calculatePerformanceMultiplier(historicalData);
        let targetingMultiplier = this.calculateTargetingMultiplier(targetingScore);
        let budgetMultiplier = this.calculateBudgetMultiplier(campaign);
        const finalBid = baseBid * performanceMultiplier * targetingMultiplier * budgetMultiplier;
        const confidence = this.calculateConfidence(historicalData, targetingScore);
        return {
            bidAmount: Math.max(0.01, Math.min(finalBid, campaign.budget * 0.1)),
            confidence,
            factors: {
                baseBid,
                performanceMultiplier,
                targetingMultiplier,
                budgetMultiplier,
                historicalData: historicalData.summary,
                adUnit: {
                    format: adUnit.format,
                    size: adUnit.size
                }
            }
        };
    }
    async getHistoricalPerformance(campaignId, organizationId) {
        const ads = await prisma_1.prisma.advertiserAd.findMany({
            where: { campaignId, organizationId },
            select: {
                impressions: true,
                clicks: true,
                conversions: true,
                ctr: true,
                cpc: true,
                cpm: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 30
        });
        if (ads.length === 0) {
            return {
                summary: {
                    avgCTR: 0.02,
                    avgCPC: 1.50,
                    avgCPM: 3.00,
                    conversionRate: 0.01,
                    totalImpressions: 0,
                    totalClicks: 0,
                    totalConversions: 0
                },
                recent: []
            };
        }
        const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
        const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
        const totalConversions = ads.reduce((sum, ad) => sum + ad.conversions, 0);
        const totalCPC = ads.reduce((sum, ad) => sum + Number(ad.cpc), 0);
        const totalCPM = ads.reduce((sum, ad) => sum + Number(ad.cpm), 0);
        return {
            summary: {
                avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) : 0,
                avgCPC: totalClicks > 0 ? totalCPC / totalClicks : 0,
                avgCPM: totalImpressions > 0 ? totalCPM / ads.length : 0,
                conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) : 0,
                totalImpressions,
                totalClicks,
                totalConversions
            },
            recent: ads.slice(0, 10)
        };
    }
    calculateBaseBid(campaign, adUnit) {
        let baseBid = 0;
        switch (campaign.bidStrategy) {
            case 'MANUAL':
                baseBid = campaign.targetCPM ? campaign.targetCPM / 1000 : 0.01;
                break;
            case 'AUTO_CPC':
                baseBid = campaign.targetCPC ? Number(campaign.targetCPC) : 1.50;
                break;
            case 'AUTO_CPM':
                baseBid = campaign.targetCPM ? campaign.targetCPM / 1000 : 0.003;
                break;
            case 'TARGET_CPA':
                baseBid = campaign.targetCPA ? Number(campaign.targetCPA) * 0.1 : 0.50;
                break;
            case 'PREDICTIVE':
                baseBid = campaign.targetCPM ? campaign.targetCPM / 1000 * 1.2 : 0.01;
                break;
            case 'AI_OPTIMIZED':
                baseBid = campaign.targetCPM ? campaign.targetCPM / 1000 * 1.5 : 0.01;
                break;
            default:
                baseBid = 0.01;
        }
        const formatMultiplier = this.getFormatMultiplier(adUnit.format);
        baseBid *= formatMultiplier;
        return baseBid;
    }
    calculatePerformanceMultiplier(historicalData) {
        const { avgCTR, avgCPC, avgCPM, conversionRate } = historicalData.summary;
        let multiplier = 1.0;
        if (avgCTR > 0.03)
            multiplier *= 1.2;
        else if (avgCTR < 0.01)
            multiplier *= 0.8;
        if (conversionRate > 0.02)
            multiplier *= 1.3;
        else if (conversionRate < 0.005)
            multiplier *= 0.7;
        if (avgCPC < 1.00)
            multiplier *= 1.1;
        else if (avgCPC > 3.00)
            multiplier *= 0.9;
        return Math.max(0.5, Math.min(2.0, multiplier));
    }
    calculateTargetingMultiplier(targetingScore) {
        if (targetingScore >= 0.9)
            return 1.3;
        if (targetingScore >= 0.7)
            return 1.1;
        if (targetingScore >= 0.5)
            return 1.0;
        if (targetingScore >= 0.3)
            return 0.9;
        return 0.7;
    }
    calculateBudgetMultiplier(campaign) {
        const budget = Number(campaign.budget);
        const spent = Number(campaign.totalSpent);
        const remainingBudget = budget - spent;
        const budgetUtilization = spent / budget;
        if (budgetUtilization > 0.9)
            return 0.8;
        if (budgetUtilization > 0.7)
            return 0.9;
        if (budgetUtilization < 0.3)
            return 1.2;
        return 1.0;
    }
    calculateConfidence(historicalData, targetingScore) {
        let confidence = 0.5;
        if (historicalData.summary.totalImpressions > 10000)
            confidence += 0.2;
        else if (historicalData.summary.totalImpressions > 1000)
            confidence += 0.1;
        const ctr = historicalData.summary.avgCTR;
        if (ctr > 0.01 && ctr < 0.05)
            confidence += 0.1;
        confidence += targetingScore * 0.2;
        return Math.min(1.0, confidence);
    }
    getFormatMultiplier(format) {
        switch (format) {
            case 'VIDEO': return 1.5;
            case 'NATIVE': return 1.3;
            case 'INTERSTITIAL': return 1.2;
            case 'BANNER': return 1.0;
            case 'DISPLAY': return 1.0;
            default: return 1.0;
        }
    }
    async simulateRTBAuction(campaignId, organizationId, adUnitId, competitors = 5) {
        const optimalBid = await this.calculateOptimalBid(campaignId, organizationId, adUnitId);
        const competitorBids = Array.from({ length: competitors }, () => Math.random() * 10 + 0.01);
        const allBids = [...competitorBids, optimalBid.bidAmount].sort((a, b) => b - a);
        const ourPosition = allBids.indexOf(optimalBid.bidAmount) + 1;
        const won = ourPosition <= 3;
        const clearingPrice = allBids.length > 1 ? allBids[1] : allBids[0];
        return {
            won,
            bidAmount: optimalBid.bidAmount,
            clearingPrice,
            position: ourPosition,
            competitors: competitors
        };
    }
}
exports.BiddingService = BiddingService;
//# sourceMappingURL=bidding.service.js.map