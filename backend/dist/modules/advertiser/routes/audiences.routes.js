"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAudiencesRoutes = setupAudiencesRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupAudiencesRoutes(app, prefix) {
    app.get(`${prefix}/campaigns/:campaignId/audiences`, async (req, res) => {
        try {
            const { campaignId } = req.params;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const audiences = await prisma_1.prisma.advertiserAudience.findMany({
                where: {
                    campaignId,
                    organizationId
                },
                include: {
                    campaign: true
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ audiences });
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
    app.post(`${prefix}/campaigns/:campaignId/audiences`, async (req, res) => {
        try {
            const { campaignId } = req.params;
            const { name, description, targeting } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!name) {
                throw (0, error_handler_1.createError)('Name is required', 400);
            }
            const audience = await prisma_1.prisma.advertiserAudience.create({
                data: {
                    organizationId,
                    campaignId,
                    name,
                    description,
                    targeting: targeting || {}
                }
            });
            res.status(201).json({
                message: 'Audience created successfully',
                audience
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
//# sourceMappingURL=audiences.routes.js.map