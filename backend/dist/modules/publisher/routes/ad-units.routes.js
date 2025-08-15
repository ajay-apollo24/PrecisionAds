"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAdUnitRoutes = setupAdUnitRoutes;
const prisma_1 = require("../../../shared/database/prisma");
const error_handler_1 = require("../../../shared/middleware/error-handler");
function setupAdUnitRoutes(app, prefix) {
    app.get(`${prefix}/sites/:siteId/ad-units`, async (req, res) => {
        try {
            const { siteId } = req.params;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const adUnits = await prisma_1.prisma.adUnit.findMany({
                where: {
                    siteId,
                    organizationId
                },
                include: {
                    site: true
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ adUnits });
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
    app.post(`${prefix}/sites/:siteId/ad-units`, async (req, res) => {
        try {
            const { siteId } = req.params;
            const { name, size, format, settings } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!name || !size || !format) {
                throw (0, error_handler_1.createError)('Name, size, and format are required', 400);
            }
            const adUnit = await prisma_1.prisma.adUnit.create({
                data: {
                    organizationId,
                    siteId,
                    name,
                    size,
                    format,
                    status: 'INACTIVE',
                    settings: settings || {}
                }
            });
            res.status(201).json({
                message: 'Ad unit created successfully',
                adUnit
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
    app.put(`${prefix}/ad-units/:id`, async (req, res) => {
        try {
            const { id } = req.params;
            const { name, size, format, status, settings } = req.body;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const adUnit = await prisma_1.prisma.adUnit.findFirst({
                where: {
                    id,
                    organizationId
                }
            });
            if (!adUnit) {
                throw (0, error_handler_1.createError)('Ad unit not found', 404);
            }
            const updatedAdUnit = await prisma_1.prisma.adUnit.update({
                where: { id },
                data: {
                    name,
                    size,
                    format,
                    status,
                    settings,
                    updatedAt: new Date()
                }
            });
            res.json({
                message: 'Ad unit updated successfully',
                adUnit: updatedAdUnit
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
//# sourceMappingURL=ad-units.routes.js.map