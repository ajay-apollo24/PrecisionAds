"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteController = void 0;
const site_service_1 = require("../services/site.service");
const error_handler_1 = require("../../../shared/middleware/error-handler");
class SiteController {
    constructor() {
        this.siteService = new site_service_1.SiteService();
    }
    async getSites(req, res) {
        try {
            const organizationId = req.headers['x-organization-id'];
            const { status, domain } = req.query;
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const filters = {
                status: status,
                domain: domain
            };
            const sites = await this.siteService.getSites(organizationId, filters);
            res.json({ sites });
        }
        catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    async getSiteById(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const site = await this.siteService.getSiteById(id, organizationId);
            if (!site) {
                throw (0, error_handler_1.createError)('Site not found', 404);
            }
            res.json({ site });
        }
        catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    async createSite(req, res) {
        try {
            const organizationId = req.headers['x-organization-id'];
            const { name, domain, settings } = req.body;
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            if (!name || !domain) {
                throw (0, error_handler_1.createError)('Name and domain are required', 400);
            }
            const site = await this.siteService.createSite({ name, domain, settings }, organizationId);
            res.status(201).json({
                message: 'Site created successfully',
                site
            });
        }
        catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    async updateSite(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.headers['x-organization-id'];
            const updateData = req.body;
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const site = await this.siteService.updateSite(id, updateData, organizationId);
            res.json({
                message: 'Site updated successfully',
                site
            });
        }
        catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    async deleteSite(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.headers['x-organization-id'];
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const site = await this.siteService.deleteSite(id, organizationId);
            res.json({
                message: 'Site deleted successfully',
                site
            });
        }
        catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    async getSiteStats(req, res) {
        try {
            const { id } = req.params;
            const organizationId = req.headers['x-organization-id'];
            const { startDate, endDate } = req.query;
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const stats = await this.siteService.getSiteStats(id, organizationId, start, end);
            res.json({ stats });
        }
        catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    async getTopPerformingSites(req, res) {
        try {
            const organizationId = req.headers['x-organization-id'];
            const { limit = 5 } = req.query;
            if (!organizationId) {
                throw (0, error_handler_1.createError)('Organization ID required', 400);
            }
            const sites = await this.siteService.getTopPerformingSites(organizationId, Number(limit));
            res.json({ sites });
        }
        catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
}
exports.SiteController = SiteController;
//# sourceMappingURL=site.controller.js.map