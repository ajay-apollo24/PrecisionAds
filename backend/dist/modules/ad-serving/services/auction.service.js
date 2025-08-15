"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class AuctionService {
    async runAuction(adRequestId) {
        try {
            const adRequest = await prisma_1.prisma.adRequest.findUnique({
                where: { id: adRequestId },
                include: {
                    adUnit: {
                        include: {
                            site: true
                        }
                    }
                }
            });
            if (!adRequest) {
                throw new Error('Ad request not found');
            }
            const eligibleAds = await this.getEligibleAds(adRequest.adUnitId, adRequest.organizationId);
            if (eligibleAds.length === 0) {
                return {
                    winner: null,
                    winningBid: 0,
                    clearingPrice: 0,
                    participants: 0,
                    auctionData: {
                        message: 'No eligible ads found',
                        adRequestId,
                        adUnitId: adRequest.adUnitId
                    }
                };
            }
            const bids = await this.collectBids(eligibleAds, adRequest);
            if (bids.length === 0) {
                return {
                    winner: null,
                    winningBid: 0,
                    clearingPrice: 0,
                    participants: 0,
                    auctionData: {
                        message: 'No valid bids received',
                        adRequestId,
                        adUnitId: adRequest.adUnitId
                    }
                };
            }
            bids.sort((a, b) => b.totalScore - a.totalScore);
            const winner = bids[0];
            const clearingPrice = bids.length > 1 ? bids[1].totalScore : winner.totalScore;
            await this.recordAuctionResult(adRequestId, winner.adId, winner.bidAmount, clearingPrice);
            return {
                winner: winner.adId,
                winningBid: winner.bidAmount,
                clearingPrice,
                participants: bids.length,
                auctionData: {
                    adRequestId,
                    adUnitId: adRequest.adUnitId,
                    siteId: adRequest.siteId,
                    totalBids: bids.length,
                    bidRange: {
                        min: Math.min(...bids.map(b => b.bidAmount)),
                        max: Math.max(...bids.map(b => b.bidAmount))
                    },
                    qualityScores: bids.map(b => ({
                        adId: b.adId,
                        qualityScore: b.qualityScore,
                        targetingScore: b.targetingScore
                    }))
                }
            };
        }
        catch (error) {
            throw new Error(`Auction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getEligibleAds(adUnitId, organizationId) {
        const adUnit = await prisma_1.prisma.adUnit.findFirst({
            where: { id: adUnitId },
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
        return eligibleAds.filter(ad => this.isAdCompatible(ad, adUnit) &&
            this.matchesTargeting(ad, adUnit));
    }
    isAdCompatible(ad, adUnit) {
        if (ad.targeting?.formats && !ad.targeting.formats.includes(adUnit.format)) {
            return false;
        }
        if (ad.targeting?.sizes && !ad.targeting.sizes.includes(adUnit.size)) {
            return false;
        }
        return true;
    }
    matchesTargeting(ad, adUnit) {
        if (!ad.targeting)
            return true;
        if (ad.targeting.geoLocation && adUnit.site.geoLocation) {
            if (!this.matchesGeoLocation(ad.targeting.geoLocation, adUnit.site.geoLocation)) {
                return false;
            }
        }
        if (ad.targeting.deviceInfo && adUnit.site.deviceInfo) {
            if (!this.matchesDeviceInfo(ad.targeting.deviceInfo, adUnit.site.deviceInfo)) {
                return false;
            }
        }
        return true;
    }
    async collectBids(eligibleAds, adRequest) {
        const bids = [];
        for (const ad of eligibleAds) {
            try {
                const bid = await this.calculateBid(ad, adRequest);
                if (bid) {
                    bids.push(bid);
                }
            }
            catch (error) {
                console.error(`Error calculating bid for ad ${ad.id}:`, error);
                continue;
            }
        }
        return bids;
    }
    async calculateBid(ad, adRequest) {
        const campaign = ad.campaign;
        let baseBid = this.calculateBaseBid(campaign);
        const qualityScore = this.calculateQualityScore(ad);
        const qualityMultiplier = 0.5 + (qualityScore * 0.5);
        const targetingScore = this.calculateTargetingScore(ad, adRequest);
        const targetingMultiplier = 0.7 + (targetingScore * 0.6);
        const finalBid = baseBid * qualityMultiplier * targetingMultiplier;
        const totalScore = finalBid + (qualityScore * 10);
        return {
            adId: ad.id,
            bidAmount: finalBid,
            qualityScore,
            targetingScore,
            totalScore,
            campaignId: campaign.id,
            organizationId: ad.organizationId
        };
    }
    calculateBaseBid(campaign) {
        switch (campaign.bidStrategy) {
            case 'MANUAL':
                return campaign.targetCPM ? Number(campaign.targetCPM) / 1000 : 0.01;
            case 'AUTO_CPC':
                return campaign.targetCPC ? Number(campaign.targetCPC) : 1.50;
            case 'AUTO_CPM':
                return campaign.targetCPM ? Number(campaign.targetCPM) / 1000 : 0.003;
            case 'TARGET_CPA':
                return campaign.targetCPA ? Number(campaign.targetCPA) * 0.1 : 0.50;
            case 'PREDICTIVE':
                return campaign.targetCPM ? Number(campaign.targetCPM) / 1000 * 1.2 : 0.01;
            case 'AI_OPTIMIZED':
                return campaign.targetCPM ? Number(campaign.targetCPM) / 1000 * 1.5 : 0.01;
            default:
                return 0.01;
        }
    }
    calculateQualityScore(ad) {
        let score = 0.5;
        if (ad.ctr > 0) {
            score += Math.min(ad.ctr * 10, 0.3);
        }
        if (ad.conversions > 0 && ad.clicks > 0) {
            const conversionRate = ad.conversions / ad.clicks;
            score += Math.min(conversionRate * 0.2, 0.2);
        }
        const adAge = Date.now() - ad.createdAt.getTime();
        const ageScore = Math.max(0, 1 - (adAge / (30 * 24 * 60 * 60 * 1000)));
        score += ageScore * 0.1;
        return Math.min(score, 1);
    }
    calculateTargetingScore(ad, adRequest) {
        if (!ad.targeting)
            return 0.5;
        let score = 0;
        let totalChecks = 0;
        if (ad.targeting.geoLocation && adRequest.geoLocation) {
            score += this.calculateGeoScore(ad.targeting.geoLocation, adRequest.geoLocation);
            totalChecks++;
        }
        if (ad.targeting.deviceInfo && adRequest.deviceInfo) {
            score += this.calculateDeviceScore(ad.targeting.deviceInfo, adRequest.deviceInfo);
            totalChecks++;
        }
        if (ad.targeting.interests && adRequest.targeting?.interests) {
            score += this.calculateInterestScore(ad.targeting.interests, adRequest.targeting.interests);
            totalChecks++;
        }
        return totalChecks > 0 ? score / totalChecks : 0.5;
    }
    async recordAuctionResult(adRequestId, winningAdId, winningBid, clearingPrice) {
        await prisma_1.prisma.adBid.create({
            data: {
                adRequestId,
                advertiserId: '',
                adId: winningAdId,
                bidAmount: winningBid,
                cpm: clearingPrice * 1000,
                won: true,
                createdAt: new Date()
            }
        });
        await prisma_1.prisma.adRequest.update({
            where: { id: adRequestId },
            data: {
                servedAdId: winningAdId,
                bidAmount: winningBid,
                cpm: clearingPrice * 1000,
                status: 'SERVED',
                updatedAt: new Date()
            }
        });
    }
    matchesGeoLocation(adGeo, requestGeo) {
        if (adGeo.country && requestGeo.country && adGeo.country !== requestGeo.country) {
            return false;
        }
        if (adGeo.region && requestGeo.region && adGeo.region !== requestGeo.region) {
            return false;
        }
        return true;
    }
    matchesDeviceInfo(adDevice, requestDevice) {
        if (adDevice.type && requestDevice.type && adDevice.type !== requestDevice.type) {
            return false;
        }
        return true;
    }
    calculateGeoScore(adGeo, requestGeo) {
        if (adGeo.country === requestGeo.country)
            return 1;
        if (adGeo.region === requestGeo.region)
            return 0.8;
        return 0.3;
    }
    calculateDeviceScore(adDevice, requestDevice) {
        if (adDevice.type === requestDevice.type)
            return 1;
        return 0.5;
    }
    calculateInterestScore(adInterests, requestInterests) {
        const intersection = adInterests.filter(interest => requestInterests.includes(interest));
        return intersection.length / Math.max(adInterests.length, requestInterests.length);
    }
}
exports.AuctionService = AuctionService;
//# sourceMappingURL=auction.service.js.map