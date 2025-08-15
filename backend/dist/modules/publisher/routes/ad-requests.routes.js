"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAdRequestRoutes = setupAdRequestRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupAdRequestRoutes(app, prefix) {
    app.get(`${prefix}/sites/:siteId/ad-requests`, async (req, res) => {
        try {
            const { siteId } = req.params;
            const { page = 1, limit = 50, status } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = {
                siteId,
                organizationId
            };
            if (status) {
                where.status = status;
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [adRequests, total] = await Promise.all([
                prisma_1.prisma.adRequest.findMany({
                    where,
                    include: {
                        adUnit: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                prisma_1.prisma.adRequest.count({ where })
            ]);
            res.json({
                adRequests,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
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
    app.get(`${prefix}/sites/:siteId/ad-requests/stats`, async (req, res) => {
        try {
            const { siteId } = req.params;
            const { startDate, endDate } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = {
                siteId,
                organizationId
            };
            if (startDate && endDate) {
                where.createdAt = {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                };
            }
            const stats = await prisma_1.prisma.adRequest.groupBy({
                by: ['status'],
                where,
                _count: {
                    status: true
                }
            });
            const totalRequests = await prisma_1.prisma.adRequest.count({ where });
            const totalImpressions = await prisma_1.prisma.adRequest.count({
                where: { ...where, impression: true }
            });
            const totalClicks = await prisma_1.prisma.adRequest.count({
                where: { ...where, clickThrough: true }
            });
            res.json({
                stats,
                summary: {
                    totalRequests,
                    totalImpressions,
                    totalClicks,
                    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
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
}
//# sourceMappingURL=ad-requests.routes.js.map