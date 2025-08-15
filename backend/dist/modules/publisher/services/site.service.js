"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class SiteService {
    async getSites(organizationId, filters = {}) {
        const where = { organizationId };
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.domain) {
            where.domain = { contains: filters.domain, mode: 'insensitive' };
        }
        return prisma_1.prisma.publisherSite.findMany({
            where,
            include: {
                adUnits: {
                    where: { status: 'ACTIVE' },
                    select: { id: true, name: true, format: true, status: true }
                },
                earnings: {
                    orderBy: { date: 'desc' },
                    take: 7,
                    select: { date: true, revenue: true, impressions: true, clicks: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getSiteById(id, organizationId) {
        return prisma_1.prisma.publisherSite.findFirst({
            where: { id, organizationId },
            include: {
                adUnits: true,
                earnings: {
                    orderBy: { date: 'desc' },
                    take: 30
                }
            }
        });
    }
    async createSite(data, organizationId) {
        return prisma_1.prisma.publisherSite.create({
            data: {
                ...data,
                organizationId,
                status: 'PENDING'
            },
            include: {
                adUnits: true,
                earnings: []
            }
        });
    }
    async updateSite(id, data, organizationId) {
        return prisma_1.prisma.publisherSite.update({
            where: { id, organizationId },
            data: {
                ...data,
                updatedAt: new Date()
            },
            include: {
                adUnits: true,
                earnings: []
            }
        });
    }
    async deleteSite(id, organizationId) {
        return prisma_1.prisma.publisherSite.update({
            where: { id, organizationId },
            data: {
                status: 'INACTIVE',
                updatedAt: new Date()
            },
            include: {
                adUnits: true,
                earnings: []
            }
        });
    }
    async getSiteStats(siteId, organizationId, startDate, endDate) {
        const where = {
            siteId,
            organizationId
        };
        if (startDate && endDate) {
            where.date = {
                gte: startDate,
                lte: endDate
            };
        }
        const [earnings, adUnits, adRequests] = await Promise.all([
            prisma_1.prisma.publisherEarning.aggregate({
                where,
                _sum: {
                    impressions: true,
                    clicks: true,
                    revenue: true
                }
            }),
            prisma_1.prisma.adUnit.count({ where: { siteId, organizationId, status: 'ACTIVE' } }),
            prisma_1.prisma.adRequest.count({ where: { siteId, organizationId } })
        ]);
        return {
            totalImpressions: earnings._sum.impressions || 0,
            totalClicks: earnings._sum.clicks || 0,
            totalRevenue: earnings._sum.revenue || 0,
            activeAdUnits: adUnits,
            totalAdRequests: adRequests,
            ctr: earnings._sum.impressions && earnings._sum.impressions > 0
                ? (earnings._sum.clicks || 0) / earnings._sum.impressions * 100
                : 0
        };
    }
    async getTopPerformingSites(organizationId, limit = 5) {
        const sites = await prisma_1.prisma.publisherSite.findMany({
            where: { organizationId, status: 'ACTIVE' },
            include: {
                earnings: {
                    orderBy: { date: 'desc' },
                    take: 30
                }
            }
        });
        const sitesWithScore = sites.map(site => {
            const totalRevenue = site.earnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
            const totalImpressions = site.earnings.reduce((sum, earning) => sum + earning.impressions, 0);
            const totalClicks = site.earnings.reduce((sum, earning) => sum + earning.clicks, 0);
            const performanceScore = (totalRevenue * 0.5) + (totalImpressions * 0.3) + (totalClicks * 0.2);
            return {
                ...site,
                performanceScore
            };
        });
        return sitesWithScore
            .sort((a, b) => b.performanceScore - a.performanceScore)
            .slice(0, limit);
    }
}
exports.SiteService = SiteService;
//# sourceMappingURL=site.service.js.map