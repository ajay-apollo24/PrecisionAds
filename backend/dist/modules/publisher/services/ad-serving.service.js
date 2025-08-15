"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdServingService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class AdServingService {
    async processAdRequest(requestData) {
        try {
            const validation = this.validateAdRequest(requestData);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors.join(', '),
                    adId: null,
                    bidAmount: null
                };
            }
            const eligibleAds = await this.getEligibleAds(requestData.adUnitId, requestData.organizationId, requestData.targeting);
            if (eligibleAds.length === 0) {
                return {
                    success: false,
                    error: 'No eligible ads found',
                    adId: null,
                    bidAmount: null
                };
            }
            const selectedAd = await this.selectBestAd(eligibleAds, requestData);
            await this.recordAdRequest(requestData, selectedAd.adId);
            return {
                success: true,
                adId: selectedAd.adId,
                bidAmount: selectedAd.bidAmount,
                cpm: selectedAd.cpm,
                targetingScore: selectedAd.targetingScore
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                adId: null,
                bidAmount: null
            };
        }
    }
    async getEligibleAds(adUnitId, organizationId, targeting) {
        const adUnit = await prisma_1.prisma.adUnit.findFirst({
            where: { id: adUnitId, organizationId },
            include: { site: true }
        });
        if (!adUnit) {
            throw new Error('Ad unit not found');
        }
        const eligibleAds = await prisma_1.prisma.advertiserAd.findMany({
            where: {
                status: 'ACTIVE',
                campaign: {
                    status: 'ACTIVE',
                    organization: {
                        orgType: 'ADVERTISER'
                    }
                }
            },
            include: {
                campaign: true,
                organization: true
            }
        });
        return eligibleAds.filter(ad => this.matchesTargeting(ad, targeting, adUnit));
    }
    async selectBestAd(eligibleAds, requestData) {
        const adsWithScores = eligibleAds.map(ad => {
            const targetingScore = this.calculateTargetingScore(ad, requestData.targeting);
            const qualityScore = this.calculateQualityScore(ad);
            const bidScore = this.calculateBidScore(ad);
            const totalScore = (targetingScore * 0.4) + (qualityScore * 0.3) + (bidScore * 0.3);
            return {
                ...ad,
                targetingScore,
                qualityScore,
                bidScore,
                totalScore
            };
        });
        adsWithScores.sort((a, b) => b.totalScore - a.totalScore);
        const winner = adsWithScores[0];
        const secondHighestBid = adsWithScores.length > 1 ? adsWithScores[1].totalScore : winner.totalScore * 0.8;
        return {
            adId: winner.id,
            bidAmount: secondHighestBid,
            cpm: winner.campaign.targetCPM || 0,
            targetingScore: winner.targetingScore
        };
    }
    matchesTargeting(ad, targeting, adUnit) {
        if (!targeting)
            return true;
        if (targeting.geoLocation && ad.targeting?.geoLocation) {
            if (!this.matchesGeoLocation(targeting.geoLocation, ad.targeting.geoLocation)) {
                return false;
            }
        }
        if (targeting.deviceInfo && ad.targeting?.deviceInfo) {
            if (!this.matchesDeviceInfo(targeting.deviceInfo, ad.targeting.deviceInfo)) {
                return false;
            }
        }
        if (adUnit && ad.targeting?.formats) {
            if (!ad.targeting.formats.includes(adUnit.format)) {
                return false;
            }
        }
        return true;
    }
    calculateTargetingScore(ad, targeting) {
        if (!targeting)
            return 0.5;
        let score = 0;
        let totalChecks = 0;
        if (targeting.geoLocation && ad.targeting?.geoLocation) {
            score += this.calculateGeoScore(targeting.geoLocation, ad.targeting.geoLocation);
            totalChecks++;
        }
        if (targeting.deviceInfo && ad.targeting?.deviceInfo) {
            score += this.calculateDeviceScore(targeting.deviceInfo, ad.targeting.deviceInfo);
            totalChecks++;
        }
        if (targeting.interests && ad.targeting?.interests) {
            score += this.calculateInterestScore(targeting.interests, ad.targeting.interests);
            totalChecks++;
        }
        return totalChecks > 0 ? score / totalChecks : 0.5;
    }
    calculateQualityScore(ad) {
        let score = 0;
        if (ad.ctr > 0) {
            score += Math.min(ad.ctr * 10, 0.4);
        }
        if (ad.conversions > 0 && ad.clicks > 0) {
            const conversionRate = ad.conversions / ad.clicks;
            score += Math.min(conversionRate * 0.3, 0.3);
        }
        const adAge = Date.now() - ad.createdAt.getTime();
        const ageScore = Math.max(0, 1 - (adAge / (30 * 24 * 60 * 60 * 1000)));
        score += ageScore * 0.1;
        return Math.min(score, 1);
    }
    calculateBidScore(ad) {
        if (!ad.campaign.targetCPM)
            return 0.5;
        const normalizedBid = Math.min(ad.campaign.targetCPM / 50, 1);
        return normalizedBid;
    }
    async recordAdRequest(requestData, adId) {
        await prisma_1.prisma.adRequest.create({
            data: {
                organizationId: requestData.organizationId,
                siteId: requestData.siteId,
                adUnitId: requestData.adUnitId,
                requestId: requestData.requestId,
                userAgent: requestData.userAgent,
                ipAddress: requestData.ipAddress,
                geoLocation: requestData.geoLocation,
                deviceInfo: requestData.deviceInfo,
                targeting: requestData.targeting,
                status: 'PROCESSED',
                servedAdId: adId
            }
        });
    }
    validateAdRequest(requestData) {
        const errors = [];
        if (!requestData.organizationId)
            errors.push('Organization ID is required');
        if (!requestData.siteId)
            errors.push('Site ID is required');
        if (!requestData.adUnitId)
            errors.push('Ad unit ID is required');
        if (!requestData.requestId)
            errors.push('Request ID is required');
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    matchesGeoLocation(requestGeo, adGeo) {
        return requestGeo.country === adGeo.country;
    }
    matchesDeviceInfo(requestDevice, adDevice) {
        return requestDevice.type === adDevice.type;
    }
    calculateGeoScore(requestGeo, adGeo) {
        if (requestGeo.country === adGeo.country)
            return 1;
        if (requestGeo.region === adGeo.region)
            return 0.8;
        return 0.3;
    }
    calculateDeviceScore(requestDevice, adDevice) {
        if (requestDevice.type === adDevice.type)
            return 1;
        return 0.5;
    }
    calculateInterestScore(requestInterests, adInterests) {
        const intersection = requestInterests.filter(interest => adInterests.includes(interest));
        return intersection.length / Math.max(requestInterests.length, adInterests.length);
    }
}
exports.AdServingService = AdServingService;
//# sourceMappingURL=ad-serving.service.js.map