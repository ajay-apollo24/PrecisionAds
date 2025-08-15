"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudienceService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class AudienceService {
    async getAudiences(campaignId, organizationId, filters = {}) {
        const where = { campaignId, organizationId };
        if (filters.name) {
            where.name = { contains: filters.name, mode: 'insensitive' };
        }
        return prisma_1.prisma.advertiserAudience.findMany({
            where,
            include: {
                campaign: {
                    select: { id: true, name: true, status: true, type: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getAudienceById(id, organizationId) {
        return prisma_1.prisma.advertiserAudience.findFirst({
            where: { id, organizationId },
            include: {
                campaign: {
                    select: { id: true, name: true, status: true, type: true }
                }
            }
        });
    }
    async createAudience(data, organizationId) {
        return prisma_1.prisma.advertiserAudience.create({
            data: {
                ...data,
                organizationId
            },
            include: {
                campaign: {
                    select: { id: true, name: true, status: true, type: true }
                }
            }
        });
    }
    async updateAudience(id, data, organizationId) {
        return prisma_1.prisma.advertiserAudience.update({
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
    async deleteAudience(id, organizationId) {
        return prisma_1.prisma.advertiserAudience.delete({
            where: { id, organizationId },
            include: {
                campaign: {
                    select: { id: true, name: true, status: true, type: true }
                }
            }
        });
    }
    async estimateAudienceSize(targeting) {
        let estimatedSize = 1000000;
        if (targeting.geoLocation) {
            if (targeting.geoLocation.country) {
                estimatedSize *= 0.3;
            }
            else if (targeting.geoLocation.region) {
                estimatedSize *= 0.1;
            }
            else if (targeting.geoLocation.city) {
                estimatedSize *= 0.05;
            }
        }
        if (targeting.demographics) {
            if (targeting.demographics.ageRange) {
                estimatedSize *= 0.4;
            }
            if (targeting.demographics.gender) {
                estimatedSize *= 0.5;
            }
        }
        if (targeting.interests && Array.isArray(targeting.interests)) {
            estimatedSize *= Math.pow(0.7, targeting.interests.length);
        }
        if (targeting.behaviors && Array.isArray(targeting.behaviors)) {
            estimatedSize *= Math.pow(0.8, targeting.behaviors.length);
        }
        return Math.max(1000, Math.round(estimatedSize));
    }
    async getAudienceInsights(audienceId, organizationId) {
        const audience = await prisma_1.prisma.advertiserAudience.findFirst({
            where: { id: audienceId, organizationId },
            select: {
                targeting: true,
                size: true,
                createdAt: true
            }
        });
        if (!audience) {
            throw new Error('Audience not found');
        }
        const targeting = audience.targeting;
        return {
            audienceId,
            estimatedSize: audience.size || 0,
            targetingBreakdown: {
                geographic: targeting.geoLocation || 'Not specified',
                demographic: targeting.demographics || 'Not specified',
                interests: targeting.interests || [],
                behaviors: targeting.behaviors || []
            },
            reachEstimate: {
                potential: audience.size || 0,
                actual: Math.round((audience.size || 0) * 0.3),
                overlap: Math.round((audience.size || 0) * 0.1)
            },
            performanceMetrics: {
                avgCTR: 2.5,
                avgConversionRate: 0.8,
                avgCPM: 3.50,
                qualityScore: 8.5
            }
        };
    }
    validateAudienceData(data) {
        const errors = [];
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Audience name is required');
        }
        if (!data.targeting || Object.keys(data.targeting).length === 0) {
            errors.push('Targeting criteria are required');
        }
        if (data.size && data.size <= 0) {
            errors.push('Audience size must be greater than 0');
        }
        if (data.targeting) {
            if (data.targeting.geoLocation && typeof data.targeting.geoLocation !== 'object') {
                errors.push('Geographic targeting must be an object');
            }
            if (data.targeting.demographics && typeof data.targeting.demographics !== 'object') {
                errors.push('Demographic targeting must be an object');
            }
            if (data.targeting.interests && !Array.isArray(data.targeting.interests)) {
                errors.push('Interests must be an array');
            }
            if (data.targeting.behaviors && !Array.isArray(data.targeting.behaviors)) {
                errors.push('Behaviors must be an array');
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.AudienceService = AudienceService;
//# sourceMappingURL=audience.service.js.map