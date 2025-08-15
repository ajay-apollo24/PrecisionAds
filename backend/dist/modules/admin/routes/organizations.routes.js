"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupOrganizationRoutes = setupOrganizationRoutes;
const organization_service_1 = __importDefault(require("../services/organization.service"));
const error_handler_1 = require("../../../shared/middleware/error-handler");
const rbac_middleware_1 = require("../../../shared/middleware/rbac.middleware");
const auth_middleware_1 = require("../../../shared/middleware/auth.middleware");
function setupOrganizationRoutes(app, prefix) {
    app.get(`${prefix}/organizations`, auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
        try {
            const { orgType, status, domain } = req.query;
            const filters = {
                orgType: orgType,
                status: status,
                domain: domain
            };
            const organizations = await organization_service_1.default.getOrganizations(filters);
            res.json({
                success: true,
                data: organizations,
                count: organizations.length
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
    app.get(`${prefix}/organizations/metrics`, auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
        try {
            const organizations = await organization_service_1.default.getOrganizationsWithMetrics();
            res.json({
                success: true,
                data: organizations,
                count: organizations.length
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
    app.get(`${prefix}/organizations/:id`, auth_middleware_1.authenticateToken, rbac_middleware_1.withOrganization, (0, rbac_middleware_1.requirePermission)(['ORG_READ']), async (req, res) => {
        try {
            const { id } = req.params;
            const organization = await organization_service_1.default.getOrganizationById(id);
            if (!organization) {
                throw (0, error_handler_1.createError)('Organization not found', 404);
            }
            res.json({
                success: true,
                data: organization
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
    app.post(`${prefix}/organizations`, auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SUPER_ADMIN']), async (req, res) => {
        try {
            const { name, orgType, domain, settings } = req.body;
            if (!name || !orgType) {
                throw (0, error_handler_1.createError)('Name and organization type are required', 400);
            }
            const organization = await organization_service_1.default.createOrganization({ name, orgType, domain, settings }, req.user.id);
            res.status(201).json({
                success: true,
                message: 'Organization created successfully',
                data: organization
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
    app.put(`${prefix}/organizations/:id`, auth_middleware_1.authenticateToken, rbac_middleware_1.withOrganization, (0, rbac_middleware_1.requirePermission)(['ORG_WRITE']), (0, rbac_middleware_1.canAccessResource)('organization'), async (req, res) => {
        try {
            const { id } = req.params;
            const { name, orgType, domain, status, settings } = req.body;
            const updateData = {
                name,
                orgType,
                domain,
                status,
                settings
            };
            const organization = await organization_service_1.default.updateOrganization(id, updateData, req.user.id);
            res.json({
                success: true,
                message: 'Organization updated successfully',
                data: organization
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
    app.delete(`${prefix}/organizations/:id`, auth_middleware_1.authenticateToken, rbac_middleware_1.withOrganization, (0, rbac_middleware_1.requirePermission)(['ORG_DELETE']), (0, rbac_middleware_1.canAccessResource)('organization'), async (req, res) => {
        try {
            const { id } = req.params;
            const organization = await organization_service_1.default.deleteOrganization(id, req.user.id);
            res.json({
                success: true,
                message: 'Organization deleted successfully',
                data: organization
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
    app.get(`${prefix}/organizations/:id/stats`, auth_middleware_1.authenticateToken, rbac_middleware_1.withOrganization, (0, rbac_middleware_1.requirePermission)(['ORG_READ']), async (req, res) => {
        try {
            const { id } = req.params;
            const stats = await organization_service_1.default.getOrganizationStats(id);
            res.json({
                success: true,
                data: stats
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
    app.post(`${prefix}/organizations/bulk/status`, auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SUPER_ADMIN']), async (req, res) => {
        try {
            const { organizationIds, status } = req.body;
            if (!organizationIds || !Array.isArray(organizationIds) || !status) {
                throw (0, error_handler_1.createError)('Organization IDs array and status are required', 400);
            }
            const results = [];
            const errors = [];
            for (const orgId of organizationIds) {
                try {
                    const organization = await organization_service_1.default.updateOrganization(orgId, { status }, req.user.id);
                    results.push({ id: orgId, status: 'success', data: organization });
                }
                catch (error) {
                    errors.push({
                        id: orgId,
                        status: 'error',
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }
            res.json({
                success: true,
                message: 'Bulk operation completed',
                results: {
                    total: organizationIds.length,
                    successful: results.length,
                    failed: errors.length,
                    results,
                    errors
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
exports.default = setupOrganizationRoutes;
//# sourceMappingURL=organizations.routes.js.map