"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAPIKeyRoutes = setupAPIKeyRoutes;
const error_handler_1 = require("../../../shared/middleware/error-handler");
const rbac_middleware_1 = require("../../../shared/middleware/rbac.middleware");
const auth_middleware_1 = require("../../../shared/middleware/auth.middleware");
const prisma_1 = require("../../../shared/database/prisma");
const db_logger_1 = require("../../../shared/middleware/db-logger");
const audit_service_1 = __importDefault(require("../../../shared/services/audit.service"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
function setupAPIKeyRoutes(app, prefix) {
    app.get(`${prefix}/api-keys`, auth_middleware_1.authenticateToken, rbac_middleware_1.withOrganization, (0, rbac_middleware_1.requirePermission)(['USERS_READ']), async (req, res) => {
        try {
            const apiKeys = await (0, db_logger_1.withQueryLogging)('get_api_keys', { organizationId: req.organizationId }, async () => {
                return await prisma_1.prisma.aPIKey.findMany({
                    where: { organizationId: req.organizationId },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });
            }, { operation: 'api_key_listing' });
            res.json({
                success: true,
                data: apiKeys,
                count: apiKeys.length
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
    app.post(`${prefix}/api-keys`, auth_middleware_1.authenticateToken, rbac_middleware_1.withOrganization, (0, rbac_middleware_1.requirePermission)(['USERS_WRITE']), async (req, res) => {
        try {
            const { name, userId, scopes, expiresAt } = req.body;
            if (!name || !userId || !scopes || !Array.isArray(scopes)) {
                throw (0, error_handler_1.createError)('Name, userId, and scopes array are required', 400);
            }
            const apiKey = crypto_1.default.randomBytes(32).toString('hex');
            const keyHash = await bcryptjs_1.default.hash(apiKey, 12);
            const apiKeyRecord = await (0, db_logger_1.withQueryLogging)('create_api_key', { name, userId, scopes, expiresAt }, async () => {
                return await prisma_1.prisma.aPIKey.create({
                    data: {
                        name,
                        keyHash,
                        organizationId: req.organizationId,
                        userId,
                        scopes: scopes,
                        status: 'ACTIVE',
                        expiresAt: expiresAt ? new Date(expiresAt) : null
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                });
            }, { operation: 'api_key_creation' });
            audit_service_1.default.logCRUDEvent(req.user.id, 'create', 'API_KEY', apiKeyRecord.id, {
                name,
                userId,
                scopes,
                expiresAt
            });
            res.status(201).json({
                success: true,
                message: 'API key created successfully',
                data: {
                    ...apiKeyRecord,
                    apiKey,
                    keyHash: undefined
                },
                warning: 'Store this API key securely. It will not be shown again.'
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
    app.put(`${prefix}/api-keys/:id`, auth_middleware_1.authenticateToken, rbac_middleware_1.withOrganization, (0, rbac_middleware_1.requirePermission)(['USERS_WRITE']), async (req, res) => {
        try {
            const { id } = req.params;
            const { name, scopes, status, expiresAt } = req.body;
            const updateData = {};
            if (name)
                updateData.name = name;
            if (scopes)
                updateData.scopes = scopes;
            if (status)
                updateData.status = status;
            if (expiresAt)
                updateData.expiresAt = new Date(expiresAt);
            const apiKey = await (0, db_logger_1.withQueryLogging)('update_api_key', { id, updateData }, async () => {
                return await prisma_1.prisma.aPIKey.update({
                    where: { id },
                    data: updateData,
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                });
            }, { operation: 'api_key_update' });
            audit_service_1.default.logCRUDEvent(req.user.id, 'update', 'API_KEY', id, updateData);
            res.json({
                success: true,
                message: 'API key updated successfully',
                data: apiKey
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
    app.delete(`${prefix}/api-keys/:id`, auth_middleware_1.authenticateToken, rbac_middleware_1.withOrganization, (0, rbac_middleware_1.requirePermission)(['USERS_DELETE']), async (req, res) => {
        try {
            const { id } = req.params;
            const apiKey = await (0, db_logger_1.withQueryLogging)('delete_api_key', { id }, async () => {
                return await prisma_1.prisma.aPIKey.update({
                    where: { id },
                    data: { status: 'REVOKED' }
                });
            }, { operation: 'api_key_deletion' });
            audit_service_1.default.logCRUDEvent(req.user.id, 'delete', 'API_KEY', id, {
                name: apiKey.name,
                status: 'REVOKED'
            });
            res.json({
                success: true,
                message: 'API key revoked successfully',
                data: apiKey
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
exports.default = setupAPIKeyRoutes;
//# sourceMappingURL=api-keys.routes.js.map