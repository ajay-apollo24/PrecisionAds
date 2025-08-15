"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePublisherAccess = requirePublisherAccess;
exports.requireSiteOwnership = requireSiteOwnership;
exports.requireAdUnitOwnership = requireAdUnitOwnership;
exports.checkPublisherPermissions = checkPublisherPermissions;
const error_handler_1 = require("../../../shared/middleware/error-handler");
function requirePublisherAccess(req, res, next) {
    try {
        const organizationId = req.headers['x-organization-id'];
        const userRole = req.headers['x-user-role'];
        if (!organizationId) {
            throw (0, error_handler_1.createError)('Organization ID required', 400);
        }
        if (!userRole) {
            throw (0, error_handler_1.createError)('User role required', 400);
        }
        if (!['PUBLISHER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
            throw (0, error_handler_1.createError)('Publisher access required', 403);
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
}
function requireSiteOwnership(req, res, next) {
    try {
        const { siteId } = req.params;
        const organizationId = req.headers['x-organization-id'];
        if (!siteId) {
            throw (0, error_handler_1.createError)('Site ID required', 400);
        }
        if (!organizationId) {
            throw (0, error_handler_1.createError)('Organization ID required', 400);
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
}
function requireAdUnitOwnership(req, res, next) {
    try {
        const { adUnitId } = req.params;
        const organizationId = req.headers['x-organization-id'];
        if (!adUnitId) {
            throw (0, error_handler_1.createError)('Ad unit ID required', 400);
        }
        if (!organizationId) {
            throw (0, error_handler_1.createError)('Organization ID required', 400);
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
}
function checkPublisherPermissions(permissions) {
    return (req, res, next) => {
        try {
            const userRole = req.headers['x-user-role'];
            const userPermissions = req.headers['x-user-permissions'];
            if (!userRole) {
                throw (0, error_handler_1.createError)('User role required', 400);
            }
            if (userRole === 'SUPER_ADMIN') {
                return next();
            }
            if (userRole === 'ADMIN') {
                return next();
            }
            if (userRole === 'PUBLISHER') {
                if (userPermissions) {
                    const userPerms = userPermissions.split(',');
                    const hasAllPermissions = permissions.every(permission => userPerms.includes(permission));
                    if (!hasAllPermissions) {
                        throw (0, error_handler_1.createError)('Insufficient permissions', 403);
                    }
                }
                else {
                    const defaultPublisherPermissions = ['READ_SITES', 'WRITE_SITES', 'READ_AD_UNITS', 'WRITE_AD_UNITS'];
                    const hasAllPermissions = permissions.every(permission => defaultPublisherPermissions.includes(permission));
                    if (!hasAllPermissions) {
                        throw (0, error_handler_1.createError)('Insufficient permissions', 403);
                    }
                }
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
}
//# sourceMappingURL=publisher-auth.middleware.js.map