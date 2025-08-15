"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetingService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class TargetingService {
    async evaluateTargeting(adId, userContext) {
        try {
            const ad = await prisma_1.prisma.advertiserAd.findUnique({
                where: { id: adId },
                include: {
                    campaign: {
                        select: { targeting: true }
                    }
                }
            });
            if (!ad) {
                throw new Error('Ad not found');
            }
            const adTargeting = ad.targeting || {};
            const campaignTargeting = ad.campaign?.targeting || {};
            const combinedTargeting = { ...campaignTargeting, ...adTargeting };
            const results = {
                geographic: this.evaluateGeographicTargeting(combinedTargeting.geoLocation, userContext.geoLocation),
                device: this.evaluateDeviceTargeting(combinedTargeting.deviceInfo, userContext.deviceInfo),
                interests: this.evaluateInterestTargeting(combinedTargeting.interests, userContext.interests),
                demographics: this.evaluateDemographicTargeting(combinedTargeting.demographics, userContext.demographics),
                behaviors: this.evaluateBehavioralTargeting(combinedTargeting.behaviors, userContext.behaviors)
            };
            const scores = Object.values(results).map(r => r.score);
            const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            const matches = overallScore >= 0.5;
            const reasons = this.generateTargetingReasons(results, overallScore);
            return {
                matches,
                score: overallScore,
                breakdown: results,
                reasons
            };
        }
        catch (error) {
            throw new Error(`Targeting evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    evaluateGeographicTargeting(adGeo, userGeo) {
        if (!adGeo || !userGeo) {
            return { matches: true, score: 0.5, details: { reason: 'No geographic targeting specified' } };
        }
        let score = 0;
        let checks = 0;
        if (adGeo.country && userGeo.country) {
            checks++;
            if (adGeo.country === userGeo.country) {
                score += 1;
            }
            else {
                score += 0;
            }
        }
        if (adGeo.region && userGeo.region) {
            checks++;
            if (adGeo.region === userGeo.region) {
                score += 1;
            }
            else {
                score += 0;
            }
        }
        if (adGeo.city && userGeo.city) {
            checks++;
            if (adGeo.city === userGeo.city) {
                score += 1;
            }
            else {
                score += 0;
            }
        }
        if (adGeo.latitude && adGeo.longitude && userGeo.latitude && userGeo.longitude) {
            checks++;
            const distance = this.calculateDistance(adGeo.latitude, adGeo.longitude, userGeo.latitude, userGeo.longitude);
            if (distance <= 50)
                score += 1;
            else if (distance <= 100)
                score += 0.8;
            else if (distance <= 200)
                score += 0.6;
            else
                score += 0.2;
        }
        const finalScore = checks > 0 ? score / checks : 0.5;
        const matches = finalScore >= 0.7;
        return {
            matches,
            score: finalScore,
            details: {
                adGeo,
                userGeo,
                checks,
                distance: adGeo.latitude && userGeo.latitude ?
                    this.calculateDistance(adGeo.latitude, adGeo.longitude, userGeo.latitude, userGeo.longitude) : null
            }
        };
    }
    evaluateDeviceTargeting(adDevice, userDevice) {
        if (!adDevice || !userDevice) {
            return { matches: true, score: 0.5, details: { reason: 'No device targeting specified' } };
        }
        let score = 0;
        let checks = 0;
        if (adDevice.type && userDevice.type) {
            checks++;
            if (adDevice.type === userDevice.type) {
                score += 1;
            }
            else {
                score += 0;
            }
        }
        if (adDevice.browser && userDevice.browser) {
            checks++;
            if (adDevice.browser === userDevice.browser) {
                score += 1;
            }
            else {
                score += 0;
            }
        }
        if (adDevice.os && userDevice.os) {
            checks++;
            if (adDevice.os === userDevice.os) {
                score += 1;
            }
            else {
                score += 0;
            }
        }
        if (adDevice.screenSize && userDevice.screenSize) {
            checks++;
            if (this.matchesScreenSize(adDevice.screenSize, userDevice.screenSize)) {
                score += 1;
            }
            else {
                score += 0;
            }
        }
        const finalScore = checks > 0 ? score / checks : 0.5;
        const matches = finalScore >= 0.7;
        return {
            matches,
            score: finalScore,
            details: {
                adDevice,
                userDevice,
                checks
            }
        };
    }
    evaluateInterestTargeting(adInterests, userInterests) {
        if (!adInterests || !userInterests || adInterests.length === 0 || userInterests.length === 0) {
            return { matches: true, score: 0.5, details: { reason: 'No interest targeting specified' } };
        }
        const intersection = adInterests.filter(interest => userInterests.includes(interest));
        const union = [...new Set([...adInterests, ...userInterests])];
        const score = intersection.length / union.length;
        const matches = score >= 0.3;
        return {
            matches,
            score,
            details: {
                adInterests,
                userInterests,
                intersection,
                overlap: score
            }
        };
    }
    evaluateDemographicTargeting(adDemographics, userDemographics) {
        if (!adDemographics || !userDemographics) {
            return { matches: true, score: 0.5, details: { reason: 'No demographic targeting specified' } };
        }
        let score = 0;
        let checks = 0;
        if (adDemographics.ageRange && userDemographics.ageRange) {
            checks++;
            if (this.matchesAgeRange(adDemographics.ageRange, userDemographics.ageRange)) {
                score += 1;
            }
            else {
                score += 0;
            }
        }
        if (adDemographics.gender && userDemographics.gender) {
            checks++;
            if (adDemographics.gender === userDemographics.gender) {
                score += 1;
            }
            else {
                score += 0;
            }
        }
        if (adDemographics.income && userDemographics.income) {
            checks++;
            if (this.matchesIncomeRange(adDemographics.income, userDemographics.income)) {
                score += 1;
            }
            else {
                score += 0;
            }
        }
        if (adDemographics.education && userDemographics.education) {
            checks++;
            if (adDemographics.education === userDemographics.education) {
                score += 1;
            }
            else {
                score += 0;
            }
        }
        const finalScore = checks > 0 ? score / checks : 0.5;
        const matches = finalScore >= 0.7;
        return {
            matches,
            score: finalScore,
            details: {
                adDemographics,
                userDemographics,
                checks
            }
        };
    }
    evaluateBehavioralTargeting(adBehaviors, userBehaviors) {
        if (!adBehaviors || !userBehaviors || adBehaviors.length === 0 || userBehaviors.length === 0) {
            return { matches: true, score: 0.5, details: { reason: 'No behavioral targeting specified' } };
        }
        let score = 0;
        let checks = 0;
        for (const adBehavior of adBehaviors) {
            const matchingUserBehavior = userBehaviors.find(ub => ub.type === adBehavior.type && ub.value === adBehavior.value);
            if (matchingUserBehavior) {
                checks++;
                const frequencyScore = this.calculateFrequencyScore(adBehavior.frequency, matchingUserBehavior.frequency);
                score += frequencyScore;
            }
        }
        const finalScore = checks > 0 ? score / checks : 0.5;
        const matches = finalScore >= 0.6;
        return {
            matches,
            score: finalScore,
            details: {
                adBehaviors,
                userBehaviors,
                checks,
                matchedBehaviors: adBehaviors.filter(ab => userBehaviors.some(ub => ub.type === ab.type && ub.value === ab.value))
            }
        };
    }
    generateTargetingReasons(results, overallScore) {
        const reasons = [];
        if (overallScore >= 0.8) {
            reasons.push('Excellent targeting match across all dimensions');
        }
        else if (overallScore >= 0.6) {
            reasons.push('Good targeting match with some areas for improvement');
        }
        else if (overallScore >= 0.4) {
            reasons.push('Moderate targeting match, consider refining criteria');
        }
        else {
            reasons.push('Poor targeting match, significant refinement needed');
        }
        Object.entries(results).forEach(([dimension, result]) => {
            if (result.score < 0.5) {
                reasons.push(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)} targeting needs improvement`);
            }
        });
        return reasons;
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    matchesScreenSize(adSize, userSize) {
        const adDimensions = adSize.split('x').map(Number);
        const userDimensions = userSize.split('x').map(Number);
        if (adDimensions.length !== 2 || userDimensions.length !== 2)
            return false;
        const adWidth = adDimensions[0];
        const adHeight = adDimensions[1];
        const userWidth = userDimensions[0];
        const userHeight = userDimensions[1];
        return adWidth <= userWidth && adHeight <= userHeight;
    }
    matchesAgeRange(adRange, userAge) {
        if (adRange.includes('-')) {
            const [min, max] = adRange.split('-').map(Number);
            return userAge >= min && userAge <= max;
        }
        else if (adRange.includes('+')) {
            const min = parseInt(adRange.replace('+', ''));
            return userAge >= min;
        }
        return false;
    }
    matchesIncomeRange(adRange, userIncome) {
        return adRange === userIncome;
    }
    calculateFrequencyScore(adFreq, userFreq) {
        if (!adFreq || !userFreq)
            return 0.5;
        const ratio = Math.min(adFreq, userFreq) / Math.max(adFreq, userFreq);
        return ratio;
    }
}
exports.TargetingService = TargetingService;
//# sourceMappingURL=targeting.service.js.map