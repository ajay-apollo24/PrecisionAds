"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupUserRoutes = setupUserRoutes;
const user_service_1 = __importDefault(require("../services/user.service"));
const error_handler_1 = require("../../../shared/middleware/error-handler");
const rbac_middleware_1 = require("../../../shared/middleware/rbac.middleware");
const auth_middleware_1 = require("../../../shared/middleware/auth.middleware");
function setupUserRoutes(app, prefix) {
    app.get(`${prefix}/users`, auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
        try {
            const { role, status, organizationId, email } = req.query;
            const filters = {
                role: role,
                status: status,
                organizationId: organizationId,
                email: email
            };
            const users = await user_service_1.default.getUsers(filters);
            res.json({
                success: true,
                data: users,
                count: users.length
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
    app.get(`${prefix}/users/role/:role`, auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
        try {
            const { role } = req.params;
            const { organizationId } = req.query;
            const users = await user_service_1.default.getUsersByRole(role, organizationId);
            res.json({
                success: true,
                data: users,
                count: users.length
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
    app.get(`${prefix}/users/:id`, auth_middleware_1.authenticateToken, rbac_middleware_1.withOrganization, (0, rbac_middleware_1.requirePermission)(['USERS_READ']), async (req, res) => {
        try {
            const { id } = req.params;
            const user = await user_service_1.default.getUserById(id);
            if (!user) {
                throw (0, error_handler_1.createError)('User not found', 404);
            }
            res.json({
                success: true,
                data: user
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
    app.post(`${prefix}/users`, auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
        try {
            const { email, password, firstName, lastName, role, organizationId, permissions } = req.body;
            if (!email || !password || !firstName || !lastName || !role) {
                throw (0, error_handler_1.createError)('Email, password, first name, last name, and role are required', 400);
            }
            const user = await user_service_1.default.createUser({ email, password, firstName, lastName, role, organizationId, permissions }, req.user.id);
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: user
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
    app.put(`${prefix}/users/:id`, auth_middleware_1.authenticateToken, rbac_middleware_1.withOrganization, (0, rbac_middleware_1.requirePermission)(['USERS_WRITE']), (0, rbac_middleware_1.canAccessResource)('user'), async (req, res) => {
        try {
            const { id } = req.params;
            const { firstName, lastName, role, status, organizationId, permissions } = req.body;
            const updateData = {
                firstName,
                lastName,
                role,
                status,
                organizationId,
                permissions
            };
            const user = await user_service_1.default.updateUser(id, updateData, req.user.id);
            res.json({
                success: true,
                message: 'User updated successfully',
                data: user
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
    app.delete(`${prefix}/users/:id`, auth_middleware_1.authenticateToken, rbac_middleware_1.withOrganization, (0, rbac_middleware_1.requirePermission)(['USERS_DELETE']), (0, rbac_middleware_1.canAccessResource)('user'), async (req, res) => {
        try {
            const { id } = req.params;
            const user = await user_service_1.default.deleteUser(id, req.user.id);
            res.json({
                success: true,
                message: 'User deleted successfully',
                data: user
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
    app.post(`${prefix}/users/:id/reset-password`, auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;
            if (!newPassword) {
                throw (0, error_handler_1.createError)('New password is required', 400);
            }
            const user = await user_service_1.default.resetPassword(id, newPassword, req.user.id);
            res.json({
                success: true,
                message: 'Password reset successfully',
                data: user
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
    app.get(`${prefix}/users/stats`, auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
        try {
            const { organizationId } = req.query;
            const stats = await user_service_1.default.getUserStats(organizationId);
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
    app.post(`${prefix}/users/bulk/status`, auth_middleware_1.authenticateToken, (0, rbac_middleware_1.requireRole)(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
        try {
            const { userIds, status } = req.body;
            if (!userIds || !Array.isArray(userIds) || !status) {
                throw (0, error_handler_1.createError)('User IDs array and status are required', 400);
            }
            const result = await user_service_1.default.bulkUpdateUserStatuses(userIds, status, req.user.id);
            res.json({
                success: true,
                message: 'Bulk status update completed',
                data: result
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
exports.default = setupUserRoutes;
//# sourceMappingURL=users.routes.js.map