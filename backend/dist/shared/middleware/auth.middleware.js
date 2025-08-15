"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
exports.requireOrganizationAccess = requireOrganizationAccess;
exports.canAccessOrganization = canAccessOrganization;
exports.rateLimit = rateLimit;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../database/prisma");
const error_handler_1 = require("./error-handler");
async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            throw (0, error_handler_1.createError)('Access token required', 401);
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                organizationId: true
            }
        });
        if (!user) {
            throw (0, error_handler_1.createError)('User not found', 401);
        }
        if (user.status !== 'ACTIVE') {
            throw (0, error_handler_1.createError)('User account is not active', 401);
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId || undefined
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
        }
        else if (error && typeof error === 'object' && 'statusCode' in error) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(401).json({ error: 'Authentication failed' });
        }
    }
}
function requireRole(roles) {
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
}
function requireOrganizationAccess(req, res, next) {
    try {
        if (!req.user) {
            throw (0, error_handler_1.createError)('Authentication required', 401);
        }
        if (!req.user.organizationId) {
            throw (0, error_handler_1.createError)('Organization access required', 403);
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
}
function canAccessOrganization(organizationId) {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw (0, error_handler_1.createError)('Authentication required', 401);
            }
            if (req.user.role === 'SUPER_ADMIN') {
                return next();
            }
            if (req.user.organizationId !== organizationId) {
                throw (0, error_handler_1.createError)('Access denied to this organization', 403);
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
function rateLimit(maxRequests, windowMs) {
    const requests = new Map();
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const requestData = requests.get(ip);
        if (!requestData || now > requestData.resetTime) {
            requests.set(ip, { count: 1, resetTime: now + windowMs });
            return next();
        }
        if (requestData.count >= maxRequests) {
            return res.status(429).json({
                error: 'Too many requests',
                message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`
            });
        }
        requestData.count++;
        next();
    };
}
exports.default = {
    authenticateToken,
    requireRole,
    requireOrganizationAccess,
    canAccessOrganization,
    rateLimit
};
//# sourceMappingURL=auth.middleware.js.map