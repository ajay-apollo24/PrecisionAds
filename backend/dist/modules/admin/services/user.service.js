"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const db_logger_1 = require("../../../shared/middleware/db-logger");
const audit_service_1 = __importDefault(require("../../../shared/services/audit.service"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserService {
    static async createUser(data, createdBy) {
        const startTime = Date.now();
        try {
            const existingUser = await prisma_1.prisma.user.findUnique({
                where: { email: data.email }
            });
            if (existingUser) {
                throw new Error('User with this email already exists');
            }
            const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
            const user = await (0, db_logger_1.withQueryLogging)('create_user', { ...data, password: '[HIDDEN]' }, async () => {
                return await prisma_1.prisma.user.create({
                    data: {
                        email: data.email,
                        password: hashedPassword,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        role: data.role,
                        organizationId: data.organizationId,
                        status: 'PENDING'
                    },
                    include: {
                        organization: {
                            select: {
                                id: true,
                                name: true,
                                orgType: true
                            }
                        }
                    }
                });
            }, { operation: 'user_creation' });
            audit_service_1.default.logCRUDEvent(createdBy, 'create', 'USER', user.id, {
                email: user.email,
                role: user.role,
                organizationId: user.organizationId
            });
            const duration = Date.now() - startTime;
            audit_service_1.default.logPerformanceMetric('user_creation_duration', duration, 'ms', 'ADMIN', { role: user.role });
            return user;
        }
        catch (error) {
            throw new Error(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async getUsers(filters = {}) {
        try {
            const where = {};
            if (filters.role) {
                where.role = filters.role;
            }
            if (filters.status) {
                where.status = filters.status;
            }
            if (filters.organizationId) {
                where.organizationId = filters.organizationId;
            }
            if (filters.email) {
                where.email = { contains: filters.email, mode: 'insensitive' };
            }
            return await (0, db_logger_1.withQueryLogging)('get_users', filters, async () => {
                return await prisma_1.prisma.user.findMany({
                    where,
                    include: {
                        organization: {
                            select: {
                                id: true,
                                name: true,
                                orgType: true
                            }
                        },
                        _count: {
                            select: {
                                sessions: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });
            }, { operation: 'user_listing' });
        }
        catch (error) {
            throw new Error(`Failed to get users: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async getUserById(id) {
        try {
            return await (0, db_logger_1.withQueryLogging)('get_user_by_id', { id }, async () => {
                return await prisma_1.prisma.user.findUnique({
                    where: { id },
                    include: {
                        organization: {
                            select: {
                                id: true,
                                name: true,
                                orgType: true
                            }
                        },
                        sessions: {
                            select: {
                                id: true,
                                createdAt: true,
                                expiresAt: true,
                                userAgent: true,
                                ipAddress: true
                            },
                            orderBy: { createdAt: 'desc' },
                            take: 10
                        }
                    }
                });
            }, { operation: 'user_detail' });
        }
        catch (error) {
            throw new Error(`Failed to get user: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async updateUser(id, data, updatedBy) {
        const startTime = Date.now();
        try {
            const updateData = {
                updatedAt: new Date()
            };
            if (data.firstName)
                updateData.firstName = data.firstName;
            if (data.lastName)
                updateData.lastName = data.lastName;
            if (data.role)
                updateData.role = data.role;
            if (data.status)
                updateData.status = data.status;
            if (data.organizationId)
                updateData.organizationId = data.organizationId;
            const user = await (0, db_logger_1.withQueryLogging)('update_user', { id, data: updateData }, async () => {
                return await prisma_1.prisma.user.update({
                    where: { id },
                    data: updateData,
                    include: {
                        organization: {
                            select: {
                                id: true,
                                name: true,
                                orgType: true
                            }
                        }
                    }
                });
            }, { operation: 'user_update' });
            audit_service_1.default.logCRUDEvent(updatedBy, 'update', 'USER', id, updateData);
            const duration = Date.now() - startTime;
            audit_service_1.default.logPerformanceMetric('user_update_duration', duration, 'ms', 'ADMIN', { role: user.role });
            return user;
        }
        catch (error) {
            throw new Error(`Failed to update user: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async deleteUser(id, deletedBy) {
        const startTime = Date.now();
        try {
            const user = await (0, db_logger_1.withQueryLogging)('delete_user', { id }, async () => {
                return await prisma_1.prisma.user.update({
                    where: { id },
                    data: {
                        status: 'INACTIVE',
                        updatedAt: new Date()
                    }
                });
            }, { operation: 'user_deletion' });
            audit_service_1.default.logCRUDEvent(deletedBy, 'delete', 'USER', id, {
                email: user.email,
                role: user.role
            });
            const duration = Date.now() - startTime;
            audit_service_1.default.logPerformanceMetric('user_deletion_duration', duration, 'ms', 'ADMIN', { role: user.role });
            return user;
        }
        catch (error) {
            throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async resetPassword(id, newPassword, resetBy) {
        try {
            const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
            const user = await (0, db_logger_1.withQueryLogging)('reset_user_password', { id, password: '[HIDDEN]' }, async () => {
                return await prisma_1.prisma.user.update({
                    where: { id },
                    data: {
                        password: hashedPassword,
                        updatedAt: new Date()
                    }
                });
            }, { operation: 'password_reset' });
            audit_service_1.default.logCRUDEvent(resetBy, 'update', 'USER_PASSWORD', id, { action: 'password_reset' });
            return user;
        }
        catch (error) {
            throw new Error(`Failed to reset password: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async getUserStats(organizationId) {
        try {
            const where = {};
            if (organizationId) {
                where.organizationId = organizationId;
            }
            const [totalUsers, activeUsers, pendingUsers, suspendedUsers] = await Promise.all([
                prisma_1.prisma.user.count({ where }),
                prisma_1.prisma.user.count({ where: { ...where, status: 'ACTIVE' } }),
                prisma_1.prisma.user.count({ where: { ...where, status: 'PENDING' } }),
                prisma_1.prisma.user.count({ where: { ...where, status: 'SUSPENDED' } })
            ]);
            return {
                totalUsers,
                activeUsers,
                pendingUsers,
                suspendedUsers,
                activePercentage: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
            };
        }
        catch (error) {
            throw new Error(`Failed to get user stats: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async getUsersByRole(role, organizationId) {
        try {
            const where = { role };
            if (organizationId) {
                where.organizationId = organizationId;
            }
            return await (0, db_logger_1.withQueryLogging)('get_users_by_role', { role, organizationId }, async () => {
                return await prisma_1.prisma.user.findMany({
                    where,
                    include: {
                        organization: {
                            select: {
                                id: true,
                                name: true,
                                orgType: true
                            }
                        }
                    },
                    orderBy: { firstName: 'asc' }
                });
            }, { operation: 'user_role_listing' });
        }
        catch (error) {
            throw new Error(`Failed to get users by role: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async bulkUpdateUserStatuses(userIds, status, updatedBy) {
        const startTime = Date.now();
        try {
            const users = await (0, db_logger_1.withQueryLogging)('bulk_update_user_statuses', { userIds, status }, async () => {
                return await prisma_1.prisma.user.updateMany({
                    where: {
                        id: { in: userIds }
                    },
                    data: {
                        status: status,
                        updatedAt: new Date()
                    }
                });
            }, { operation: 'bulk_user_status_update' });
            audit_service_1.default.logCRUDEvent(updatedBy, 'update', 'USER_BULK', 'bulk_update', {
                userIds,
                status,
                count: userIds.length.toString()
            });
            const duration = Date.now() - startTime;
            audit_service_1.default.logPerformanceMetric('bulk_user_update_duration', duration, 'ms', 'ADMIN', { count: userIds.length, status });
            return users;
        }
        catch (error) {
            throw new Error(`Failed to bulk update user statuses: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.UserService = UserService;
exports.default = UserService;
//# sourceMappingURL=user.service.js.map