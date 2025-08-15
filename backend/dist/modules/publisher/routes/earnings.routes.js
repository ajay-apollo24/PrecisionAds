"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupEarningsRoutes = setupEarningsRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupEarningsRoutes(app, prefix) {
    app.get(`${prefix}/sites/:siteId/earnings`, async (req, res) => {
        try {
            const { siteId } = req.params;
            const { startDate, endDate, groupBy = 'day' } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = {
                siteId,
                organizationId
            };
            if (startDate && endDate) {
                where.date = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            let earnings;
            if (groupBy === 'month') {
                earnings = await prisma_1.prisma.$queryRaw `
          SELECT 
            DATE_TRUNC('month', date) as period,
            SUM(impressions) as total_impressions,
            SUM(clicks) as total_clicks,
            SUM(revenue) as total_revenue,
            AVG(cpm) as avg_cpm,
            AVG(cpc) as avg_cpc
          FROM publisher_earnings 
          WHERE "siteId" = ${siteId} 
            AND "organizationId" = ${organizationId}
            ${startDate ? `AND date >= ${new Date(startDate)}` : ''}
            ${endDate ? `AND date <= ${new Date(endDate)}` : ''}
          GROUP BY DATE_TRUNC('month', date)
          ORDER BY period DESC
        `;
            }
            else {
                earnings = await prisma_1.prisma.publisherEarning.findMany({
                    where,
                    orderBy: { date: 'desc' }
                });
            }
            const totals = await prisma_1.prisma.publisherEarning.aggregate({
                where,
                _sum: {
                    impressions: true,
                    clicks: true,
                    revenue: true
                },
                _avg: {
                    cpm: true,
                    cpc: true
                }
            });
            res.json({
                earnings,
                totals: {
                    totalImpressions: totals._sum.impressions || 0,
                    totalClicks: totals._sum.clicks || 0,
                    totalRevenue: totals._sum.revenue || 0,
                    averageCPM: totals._avg.cpm || 0,
                    averageCPC: totals._avg.cpc || 0
                }
            });
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
    app.get(`${prefix}/earnings/summary`, async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = { organizationId };
            if (startDate && endDate) {
                where.date = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            const summary = await prisma_1.prisma.publisherEarning.aggregate({
                where,
                _sum: {
                    impressions: true,
                    clicks: true,
                    revenue: true
                },
                _avg: {
                    cpm: true,
                    cpc: true
                }
            });
            const topSites = await prisma_1.prisma.publisherEarning.groupBy({
                by: ['siteId'],
                where,
                _sum: {
                    revenue: true,
                    impressions: true,
                    clicks: true
                },
                orderBy: {
                    _sum: {
                        revenue: 'desc'
                    }
                },
                take: 5
            });
            res.json({
                summary: {
                    totalImpressions: summary._sum.impressions || 0,
                    totalClicks: summary._sum.clicks || 0,
                    totalRevenue: summary._sum.revenue || 0,
                    averageCPM: summary._avg.cpm || 0,
                    averageCPC: summary._avg.cpc || 0
                },
                topSites
            });
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
}
//# sourceMappingURL=earnings.routes.js.map