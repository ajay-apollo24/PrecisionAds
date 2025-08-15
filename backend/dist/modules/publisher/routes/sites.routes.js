"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSiteRoutes = setupSiteRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupSiteRoutes(app, prefix) {
    app.get(`${prefix}/sites`, async (req, res) => {
        try {
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const sites = await prisma_1.prisma.publisherSite.findMany({
                where: { organizationId },
                include: {
                    adUnits: true,
                    earnings: {
                        orderBy: { date: 'desc' },
                        take: 30
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ sites });
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
    app.post(`${prefix}/sites`, async (req, res) => {
        try {
            const { name, domain, settings } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!name || !domain) {
                throw (0, error_handler_1.createError)('Name and domain are required', 400);
            }
            const site = await prisma_1.prisma.publisherSite.create({
                data: {
                    organizationId,
                    name,
                    domain,
                    status: 'PENDING',
                    settings: settings || {}
                }
            });
            res.status(201).json({
                message: 'Site created successfully',
                site
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
//# sourceMappingURL=sites.routes.js.map