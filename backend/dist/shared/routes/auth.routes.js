"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuthRoutes = setupAuthRoutes;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../database/prisma");
const error_handler_1 = require("../middleware/error-handler");
function setupAuthRoutes(app, prefix) {
    app.post(`${prefix}/register`, async (req, res) => {
        try {
            const { email, password, firstName, lastName, role, organizationName, orgType } = req.body;
            if (!email || !password || !firstName || !lastName || !role) {
                throw (0, error_handler_1.createError)('Missing required fields', 400);
            }
            const existingUser = await prisma_1.prisma.user.findUnique({
                where: { email }
            });
            if (existingUser) {
                throw (0, error_handler_1.createError)('User already exists', 409);
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 12);
            let organizationId;
            if (organizationName && orgType) {
                const organization = await prisma_1.prisma.organization.create({
                    data: {
                        name: organizationName,
                        orgType,
                        status: 'ACTIVE'
                    }
                });
                organizationId = organization.id;
            }
            const user = await prisma_1.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role,
                    organizationId,
                    status: 'PENDING'
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    organizationId: true,
                    createdAt: true
                }
            });
            res.status(201).json({
                message: 'User registered successfully',
                user
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
    app.post(`${prefix}/login`, async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                throw (0, error_handler_1.createError)('Email and password are required', 400);
            }
            const user = await prisma_1.prisma.user.findUnique({
                where: { email },
                include: {
                    organization: true
                }
            });
            if (!user) {
                throw (0, error_handler_1.createError)('Invalid credentials', 401);
            }
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
            if (!isValidPassword) {
                throw (0, error_handler_1.createError)('Invalid credentials', 401);
            }
            if (user.status !== 'ACTIVE') {
                throw (0, error_handler_1.createError)('Account is not active', 403);
            }
            const token = jsonwebtoken_1.default.sign({
                userId: user.id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId
            }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() }
            });
            await prisma_1.prisma.userSession.create({
                data: {
                    userId: user.id,
                    token,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    userAgent: req.get('User-Agent'),
                    ipAddress: req.ip
                }
            });
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    organization: user.organization
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
    app.post(`${prefix}/logout`, async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (token) {
                await prisma_1.prisma.userSession.deleteMany({
                    where: { token }
                });
            }
            res.json({ message: 'Logout successful' });
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    app.get(`${prefix}/me`, async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                throw (0, error_handler_1.createError)('No token provided', 401);
            }
            const session = await prisma_1.prisma.userSession.findUnique({
                where: { token },
                include: {
                    user: {
                        include: {
                            organization: true
                        }
                    }
                }
            });
            if (!session || session.expiresAt < new Date()) {
                throw (0, error_handler_1.createError)('Invalid or expired token', 401);
            }
            res.json({
                user: {
                    id: session.user.id,
                    email: session.user.email,
                    firstName: session.user.firstName,
                    lastName: session.user.lastName,
                    role: session.user.role,
                    organization: session.user.organization
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
//# sourceMappingURL=auth.routes.js.map