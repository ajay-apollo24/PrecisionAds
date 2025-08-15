"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPermissions = exports.hasPermission = exports.validateAPIKey = exports.canAccessResource = exports.requireRole = exports.requirePermission = exports.withOrganization = void 0;
const prisma_1 = require("../database/prisma");
const error_handler_1 = require("./error-handler");
const withOrganization = async (req, res, next) => {
    try {
        const headerOrgId = req.headers['x-organization-id'];
        const userOrgId = req.user?.organizationId;
        if (!headerOrgId && !userOrgId) {
            throw (0, error_handler_1.createError)('Organization ID required', 400);
        }
        const organizationId = headerOrgId || userOrgId;
        if (!organizationId) {
            throw (0, error_handler_1.createError)('Organization ID required', 400);
        }
        const organization = await prisma_1.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { id: true, status: true }
        });
        if (!organization) {
            throw (0, error_handler_1.createError)('Organization not found', 404);
        }
        if (organization.status !== 'ACTIVE') {
            throw (0, error_handler_1.createError)('Organization is not active', 403);
        }
        if (req.user) {
            if (req.user.role === 'SUPER_ADMIN') {
                req.organizationId = organizationId;
                return next();
            }
            if (req.user.organizationId !== organizationId) {
                throw (0, error_handler_1.createError)('Access denied to this organization', 403);
            }
        }
        req.organizationId = organizationId;
        next();
    }
    catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
exports.withOrganization = withOrganization;
const requirePermission = (permissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw (0, error_handler_1.createError)('Authentication required', 401);
            }
            if (!req.organizationId) {
                throw (0, error_handler_1.createError)('Organization context required', 400);
            }
            if (req.user.role === 'SUPER_ADMIN') {
                return next();
            }
            const userPermissions = await prisma_1.prisma.userPermission.findMany({
                where: {
                    userId: req.user.id,
                    isActive: true,
                    expiresAt: {
                        gte: new Date()
                    },
                    permission: {
                        organizationId: req.organizationId,
                        isActive: true,
                        scope: {
                            in: permissions
                        }
                    }
                },
                include: {
                    permission: {
                        select: {
                            scope: true
                        }
                    }
                }
            });
            const userScopes = userPermissions.map(up => up.permission.scope);
            const hasAllPermissions = permissions.every(permission => userScopes.includes(permission));
            if (!hasAllPermissions) {
                throw (0, error_handler_1.createError)('Insufficient permissions', 403);
            }
            next();
        }
        catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    };
};
exports.requirePermission = requirePermission;
const requireRole = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw (0, error_handler_1.createError)('Authentication required', 401);
            }
            if (!roles.includes(req.user.role)) {
                throw (0, error_handler_1.createError)('Insufficient permissions', 403);
            }
            next();
        }
        catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    };
};
exports.requireRole = requireRole;
const canAccessResource = (resourceType, resourceIdField = 'id') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw (0, error_handler_1.createError)('Authentication required', 401);
            }
            if (!req.organizationId) {
                throw (0, error_handler_1.createError)('Organization context required', 400);
            }
            if (req.user.role === 'SUPER_ADMIN') {
                return next();
            }
            const resourceId = req.params[resourceIdField] || req.body[resourceIdField];
            if (!resourceId) {
                throw (0, error_handler_1.createError)('Resource ID required', 400);
            }
            const resource = await prisma_1.prisma[resourceType].findUnique({
                where: { id: resourceId },
                select: { organizationId: true }
            });
            if (!resource) {
                throw (0, error_handler_1.createError)('Resource not found', 404);
            }
            if (resource.organizationId !== req.organizationId) {
                throw (0, error_handler_1.createError)('Access denied to this resource', 403);
            }
            next();
        }
        catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    };
};
exports.canAccessResource = canAccessResource;
const validateAPIKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            throw (0, error_handler_1.createError)('API key required', 401);
        }
        const keyRecord = await prisma_1.prisma.aPIKey.findFirst({
            where: {
                keyHash: apiKey,
                status: 'ACTIVE',
                expiresAt: {
                    gte: new Date()
                }
            },
            include: {
                organization: {
                    select: { id: true, status: true }
                },
                user: {
                    select: { id: true, role: true, status: true }
                }
            }
        });
        if (!keyRecord) {
            throw (0, error_handler_1.createError)('Invalid or expired API key', 401);
        }
        if (keyRecord.organization.status !== 'ACTIVE') {
            throw (0, error_handler_1.createError)('Organization is not active', 403);
        }
        if (keyRecord.user.status !== 'ACTIVE') {
            throw (0, error_handler_1.createError)('User account is not active', 403);
        }
        req.organizationId = keyRecord.organization.id;
        req.user = {
            id: keyRecord.user.id,
            email: '',
            role: keyRecord.user.role,
            organizationId: keyRecord.organization.id
        };
        await prisma_1.prisma.aPIKey.update({
            where: { id: keyRecord.id },
            data: { lastUsedAt: new Date() }
        });
        next();
    }
    catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
exports.validateAPIKey = validateAPIKey;
const hasPermission = async (userId, organizationId, permission) => {
    try {
        const userPermission = await prisma_1.prisma.userPermission.findFirst({
            where: {
                userId,
                isActive: true,
                expiresAt: {
                    gte: new Date()
                },
                permission: {
                    organizationId,
                    isActive: true,
                    scope: permission
                }
            }
        });
        return !!userPermission;
    }
    catch (error) {
        return false;
    }
};
exports.hasPermission = hasPermission;
const getUserPermissions = async (userId, organizationId) => {
    try {
        const userPermissions = await prisma_1.prisma.userPermission.findMany({
            where: {
                userId,
                isActive: true,
                expiresAt: {
                    gte: new Date()
                },
                permission: {
                    organizationId,
                    isActive: true
                }
            },
            include: {
                permission: {
                    select: {
                        scope: true
                    }
                }
            }
        });
        return userPermissions.map(up => up.permission.scope);
    }
    catch (error) {
        return [];
    }
};
exports.getUserPermissions = getUserPermissions;
exports.default = {
    withOrganization: exports.withOrganization,
    requirePermission: exports.requirePermission,
    requireRole: exports.requireRole,
    canAccessResource: exports.canAccessResource,
    validateAPIKey: exports.validateAPIKey,
    hasPermission: exports.hasPermission,
    getUserPermissions: exports.getUserPermissions
};
//# sourceMappingURL=rbac.middleware.js.map