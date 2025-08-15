"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
class RevenueService {
    async getSiteEarnings(siteId, organizationId, filters = {}) {
        const where = { siteId, organizationId };
        if (filters.startDate && filters.endDate) {
            where.date = {
                gte: filters.startDate,
                lte: filters.endDate
            };
        }
        const earnings = await prisma_1.prisma.publisherEarning.findMany({
            where,
            orderBy: { date: 'asc' }
        });
        return this.calculateRevenueStats(earnings);
    }
    async getOrganizationEarnings(organizationId, filters = {}) {
        const where = { organizationId };
        if (filters.startDate && filters.endDate) {
            where.date = {
                gte: filters.startDate,
                lte: filters.endDate
            };
        }
        const [earnings, sites] = await Promise.all([
            prisma_1.prisma.publisherEarning.findMany({ where }),
            prisma_1.prisma.publisherSite.findMany({
                where: { organizationId, status: 'ACTIVE' },
                include: {
                    earnings: {
                        where: filters.startDate && filters.endDate ? {
                            date: {
                                gte: filters.startDate,
                                lte: filters.endDate
                            }
                        } : {},
                        orderBy: { date: 'desc' },
                        take: 30
                    }
                }
            })
        ]);
        const totalStats = this.calculateRevenueStats(earnings);
        const topPerformingSites = this.getTopPerformingSites(sites);
        return {
            totalStats,
            topPerformingSites,
            siteCount: sites.length,
            averageRevenuePerSite: sites.length > 0 ? totalStats.totalRevenue / sites.length : 0
        };
    }
    async getEarningsBreakdown(organizationId, period, startDate, endDate) {
        const where = {
            organizationId,
            date: {
                gte: startDate,
                lte: endDate
            }
        };
        let groupBy;
        let dateFormat;
        switch (period) {
            case 'daily':
                groupBy = 'DATE_TRUNC(\'day\', date)';
                dateFormat = 'YYYY-MM-DD';
                break;
            case 'weekly':
                groupBy = 'DATE_TRUNC(\'week\', date)';
                dateFormat = 'YYYY-WW';
                break;
            case 'monthly':
                groupBy = 'DATE_TRUNC(\'month\', date)';
                dateFormat = 'YYYY-MM';
                break;
            default:
                groupBy = 'DATE_TRUNC(\'day\', date)';
                dateFormat = 'YYYY-MM-DD';
        }
        const breakdown = await prisma_1.prisma.$queryRaw `
      SELECT 
        ${groupBy} as period,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(revenue) as total_revenue,
        AVG(cpm) as avg_cpm,
        AVG(cpc) as avg_cpc
      FROM publisher_earnings 
      WHERE "organizationId" = ${organizationId}
        AND date >= ${startDate}
        AND date <= ${endDate}
      GROUP BY ${groupBy}
      ORDER BY period DESC
    `;
        return breakdown;
    }
    calculateRevenueStats(earnings) {
        if (earnings.length === 0) {
            return {
                totalImpressions: 0,
                totalClicks: 0,
                totalRevenue: 0,
                averageCPM: 0,
                averageCPC: 0,
                ctr: 0,
                totalDays: 0
            };
        }
        const totalImpressions = earnings.reduce((sum, earning) => sum + earning.impressions, 0);
        const totalClicks = earnings.reduce((sum, earning) => sum + earning.clicks, 0);
        const totalRevenue = earnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
        const totalCPM = earnings.reduce((sum, earning) => sum + Number(earning.cpm), 0);
        const totalCPC = earnings.reduce((sum, earning) => sum + Number(earning.cpc), 0);
        return {
            totalImpressions,
            totalClicks,
            totalRevenue,
            averageCPM: totalCPM / earnings.length,
            averageCPC: totalCPC / earnings.length,
            ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
            totalDays: earnings.length
        };
    }
    getTopPerformingSites(sites) {
        return sites
            .map(site => {
            const totalRevenue = site.earnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
            const totalImpressions = site.earnings.reduce((sum, earning) => sum + earning.impressions, 0);
            const totalClicks = site.earnings.reduce((sum, earning) => sum + earning.clicks, 0);
            return {
                id: site.id,
                name: site.name,
                domain: site.domain,
                totalRevenue,
                totalImpressions,
                totalClicks,
                ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
            };
        })
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);
    }
    async calculateRevenueProjections(organizationId, days = 30) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
        const earnings = await prisma_1.prisma.publisherEarning.findMany({
            where: {
                organizationId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { date: 'asc' }
        });
        if (earnings.length < 7) {
            return {
                projectedRevenue: 0,
                confidence: 0,
                factors: { message: 'Insufficient data for projection' }
            };
        }
        const totalRevenue = earnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
        const dailyAverage = totalRevenue / earnings.length;
        const recentEarnings = earnings.slice(-7);
        const olderEarnings = earnings.slice(0, 7);
        const recentRevenue = recentEarnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
        const olderRevenue = olderEarnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
        const growthRate = olderRevenue > 0 ? (recentRevenue - olderRevenue) / olderRevenue : 0;
        const projectedRevenue = dailyAverage * 30 * (1 + growthRate);
        const confidence = Math.min(0.9, Math.max(0.3, 0.7 + (earnings.length / 100)));
        return {
            projectedRevenue: Math.max(0, projectedRevenue),
            confidence,
            factors: {
                dailyAverage,
                growthRate,
                dataPoints: earnings.length,
                period: days
            }
        };
    }
    async getRevenueAlerts(organizationId) {
        const alerts = [];
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const recentEarnings = await prisma_1.prisma.publisherEarning.findMany({
            where: {
                organizationId,
                date: {
                    gte: yesterday
                }
            }
        });
        if (recentEarnings.length > 0) {
            const recentRevenue = recentEarnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
            const previousDay = new Date(yesterday.getTime() - 24 * 60 * 60 * 1000);
            const previousEarnings = await prisma_1.prisma.publisherEarning.findMany({
                where: {
                    organizationId,
                    date: {
                        gte: previousDay,
                        lt: yesterday
                    }
                }
            });
            if (previousEarnings.length > 0) {
                const previousRevenue = previousEarnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
                const revenueChange = previousRevenue > 0 ? (recentRevenue - previousRevenue) / previousRevenue : 0;
                if (revenueChange < -0.2) {
                    alerts.push({
                        type: 'REVENUE_DROP',
                        severity: 'HIGH',
                        message: `Revenue dropped by ${Math.abs(revenueChange * 100).toFixed(1)}% compared to previous day`,
                        revenueChange,
                        currentRevenue: recentRevenue,
                        previousRevenue
                    });
                }
            }
        }
        return alerts;
    }
}
exports.RevenueService = RevenueService;
//# sourceMappingURL=revenue.service.js.map