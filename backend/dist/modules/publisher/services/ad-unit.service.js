"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdUnitService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class AdUnitService {
    async getAdUnits(siteId, organizationId, filters = {}) {
        const where = { siteId, organizationId };
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.format) {
            where.format = filters.format;
        }
        return prisma_1.prisma.adUnit.findMany({
            where,
            include: {
                site: {
                    select: { id: true, name: true, domain: true }
                },
                adRequests: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: { id: true, status: true, createdAt: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getAdUnitById(id, organizationId) {
        return prisma_1.prisma.adUnit.findFirst({
            where: { id, organizationId },
            include: {
                site: {
                    select: { id: true, name: true, domain: true }
                },
                adRequests: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            }
        });
    }
    async createAdUnit(data, organizationId) {
        return prisma_1.prisma.adUnit.create({
            data: {
                ...data,
                organizationId,
                status: 'INACTIVE'
            },
            include: {
                site: {
                    select: { id: true, name: true, domain: true }
                },
                adRequests: []
            }
        });
    }
    async updateAdUnit(id, data, organizationId) {
        return prisma_1.prisma.adUnit.update({
            where: { id, organizationId },
            data: {
                ...data,
                updatedAt: new Date()
            },
            include: {
                site: {
                    select: { id: true, name: true, domain: true }
                },
                adRequests: []
            }
        });
    }
    async deleteAdUnit(id, organizationId) {
        return prisma_1.prisma.adUnit.update({
            where: { id, organizationId },
            data: {
                status: 'INACTIVE',
                updatedAt: new Date()
            },
            include: {
                site: {
                    select: { id: true, name: true, domain: true }
                },
                adRequests: []
            }
        });
    }
    async getAdUnitStats(adUnitId, organizationId, startDate, endDate) {
        const where = {
            adUnitId,
            organizationId
        };
        if (startDate && endDate) {
            where.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }
        const [adRequests, impressions, clicks] = await Promise.all([
            prisma_1.prisma.adRequest.count({ where }),
            prisma_1.prisma.adRequest.count({ where: { ...where, impression: true } }),
            prisma_1.prisma.adRequest.count({ where: { ...where, clickThrough: true } })
        ]);
        return {
            totalRequests: adRequests,
            totalImpressions: impressions,
            totalClicks: clicks,
            ctr: adRequests > 0 ? (clicks / adRequests) * 100 : 0
        };
    }
    async getTopPerformingAdUnits(siteId, organizationId, limit = 5) {
        const adUnits = await prisma_1.prisma.adUnit.findMany({
            where: { siteId, organizationId, status: 'ACTIVE' },
            include: {
                adRequests: {
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    }
                }
            }
        });
        const adUnitsWithScore = adUnits.map(adUnit => {
            const totalRequests = adUnit.adRequests.length;
            const totalImpressions = adUnit.adRequests.filter(req => req.impression).length;
            const totalClicks = adUnit.adRequests.filter(req => req.clickThrough).length;
            const performanceScore = (totalImpressions * 0.4) + (totalClicks * 0.6);
            return {
                ...adUnit,
                performanceScore
            };
        });
        return adUnitsWithScore
            .sort((a, b) => b.performanceScore - a.performanceScore)
            .slice(0, limit);
    }
    validateAdUnitSettings(settings) {
        const errors = [];
        if (settings.targeting) {
            if (typeof settings.targeting !== 'object') {
                errors.push('Targeting must be an object');
            }
        }
        if (settings.frequencyCaps) {
            if (typeof settings.frequencyCaps !== 'object') {
                errors.push('Frequency caps must be an object');
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.AdUnitService = AdUnitService;
//# sourceMappingURL=ad-unit.service.js.map