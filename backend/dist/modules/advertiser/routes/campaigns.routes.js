"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCampaignRoutes = setupCampaignRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupCampaignRoutes(app, prefix) {
    app.get(`${prefix}/campaigns`, async (req, res) => {
        try {
            const { page = 1, limit = 50, status, type } = req.query;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const where = { organizationId };
            if (status) {
                where.status = status;
            }
            if (type) {
                where.type = type;
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [campaigns, total] = await Promise.all([
                prisma_1.prisma.advertiserCampaign.findMany({
                    where,
                    include: {
                        ads: true,
                        audiences: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                prisma_1.prisma.advertiserCampaign.count({ where })
            ]);
            res.json({
                campaigns,
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
    app.post(`${prefix}/campaigns`, async (req, res) => {
        try {
            const { name, type, startDate, endDate, budget, budgetType, bidStrategy, targetCPM, targetCPC, targetCPA, dailyBudget } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!name || !type || !budget || !budgetType || !bidStrategy) {
                throw (0, error_handler_1.createError)('Missing required fields', 400);
            }
            const campaign = await prisma_1.prisma.advertiserCampaign.create({
                data: {
                    organizationId,
                    name,
                    type,
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    budget,
                    budgetType,
                    bidStrategy,
                    targetCPM,
                    targetCPC,
                    targetCPA,
                    dailyBudget
                }
            });
            res.status(201).json({
                message: 'Campaign created successfully',
                campaign
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
//# sourceMappingURL=campaigns.routes.js.map