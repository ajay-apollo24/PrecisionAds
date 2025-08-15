import { prisma } from '../../../shared/database/prisma';
import { withQueryLogging } from '../../../shared/middleware/db-logger';
import AuditService from '../../../shared/services/audit.service';
import bcrypt from 'bcryptjs';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  status?: string;
  organizationId?: string;
  permissions?: string[];
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: string;
  organizationId?: string;
  permissions?: string[];
}

export interface UserFilters {
  role?: string;
  status?: string;
  organizationId?: string;
  email?: string;
}

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(
    data: CreateUserData,
    createdBy: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      const user = await withQueryLogging(
        'create_user',
        { ...data, password: '[HIDDEN]' },
        async () => {
          return await prisma.user.create({
            data: {
              email: data.email,
              password: hashedPassword,
              firstName: data.firstName,
              lastName: data.lastName,
              role: data.role as any,
              organizationId: data.organizationId,
              status: (data.status as any) || 'PENDING'
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
        },
        { operation: 'user_creation' }
      );

      // Log audit event
      AuditService.logCRUDEvent(
        createdBy,
        'create',
        'USER',
        user.id,
        {
          email: user.email,
          role: user.role,
          organizationId: user.organizationId
        }
      );

      // Log performance metric
      const duration = Date.now() - startTime;
      AuditService.logPerformanceMetric(
        'user_creation_duration',
        duration,
        'ms',
        'ADMIN',
        { role: user.role }
      );

      return user;
    } catch (error) {
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all users with optional filtering
   */
  static async getUsers(filters: UserFilters = {}): Promise<any[]> {
    try {
      const where: any = {};

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

      return await withQueryLogging(
        'get_users',
        filters,
        async () => {
          return await prisma.user.findMany({
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
        },
        { operation: 'user_listing' }
      );
    } catch (error) {
      throw new Error(`Failed to get users: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<any> {
    try {
      return await withQueryLogging(
        'get_user_by_id',
        { id },
        async () => {
          return await prisma.user.findUnique({
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
        },
        { operation: 'user_detail' }
      );
    } catch (error) {
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update user
   */
  static async updateUser(
    id: string,
    data: UpdateUserData,
    updatedBy: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      const updateData: any = {
        updatedAt: new Date()
      };

      if (data.firstName) updateData.firstName = data.firstName;
      if (data.lastName) updateData.lastName = data.lastName;
      if (data.role) updateData.role = data.role as any;
      if (data.status) updateData.status = data.status as any;
      if (data.organizationId) updateData.organizationId = data.organizationId;

      const user = await withQueryLogging(
        'update_user',
        { id, data: updateData },
        async () => {
          return await prisma.user.update({
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
        },
        { operation: 'user_update' }
      );

      // Log audit event
      AuditService.logCRUDEvent(
        updatedBy,
        'update',
        'USER',
        id,
        updateData
      );

      // Log performance metric
      const duration = Date.now() - startTime;
      AuditService.logPerformanceMetric(
        'user_update_duration',
        duration,
        'ms',
        'ADMIN',
        { role: user.role }
      );

      return user;
    } catch (error) {
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete user (soft delete by setting status)
   */
  static async deleteUser(
    id: string,
    deletedBy: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      const user = await withQueryLogging(
        'delete_user',
        { id },
        async () => {
          return await prisma.user.update({
            where: { id },
                    data: {
          status: 'INACTIVE' as any,
          updatedAt: new Date()
        }
          });
        },
        { operation: 'user_deletion' }
      );

      // Log audit event
      AuditService.logCRUDEvent(
        deletedBy,
        'delete',
        'USER',
        id,
        {
          email: user.email,
          role: user.role
        }
      );

      // Log performance metric
      const duration = Date.now() - startTime;
      AuditService.logPerformanceMetric(
        'user_deletion_duration',
        duration,
        'ms',
        'ADMIN',
        { role: user.role }
      );

      return user;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Reset user password
   */
  static async resetPassword(
    id: string,
    newPassword: string,
    resetBy: string
  ): Promise<any> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      const user = await withQueryLogging(
        'reset_user_password',
        { id, password: '[HIDDEN]' },
        async () => {
          return await prisma.user.update({
            where: { id },
            data: {
              password: hashedPassword,
              updatedAt: new Date()
            }
          });
        },
        { operation: 'password_reset' }
      );

      // Log audit event
      AuditService.logCRUDEvent(
        resetBy,
        'update',
        'USER_PASSWORD',
        id,
        { action: 'password_reset' }
      );

      return user;
    } catch (error) {
      throw new Error(`Failed to reset password: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(organizationId?: string): Promise<any> {
    try {
      const where: any = {};
      if (organizationId) {
        where.organizationId = organizationId;
      }

      const [totalUsers, activeUsers, pendingUsers, suspendedUsers] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.count({ where: { ...where, status: 'ACTIVE' } }),
        prisma.user.count({ where: { ...where, status: 'PENDING' } }),
        prisma.user.count({ where: { ...where, status: 'SUSPENDED' } })
      ]);

      return {
        totalUsers,
        activeUsers,
        pendingUsers,
        suspendedUsers,
        activePercentage: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
      };
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: string, organizationId?: string): Promise<any[]> {
    try {
      const where: any = { role };
      if (organizationId) {
        where.organizationId = organizationId;
      }

      return await withQueryLogging(
        'get_users_by_role',
        { role, organizationId },
        async () => {
          return await prisma.user.findMany({
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
        },
        { operation: 'user_role_listing' }
      );
    } catch (error) {
      throw new Error(`Failed to get users by role: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Bulk update user statuses
   */
  static async bulkUpdateUserStatuses(
    userIds: string[],
    status: string,
    updatedBy: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      const users = await withQueryLogging(
        'bulk_update_user_statuses',
        { userIds, status },
        async () => {
          return await prisma.user.updateMany({
            where: {
              id: { in: userIds }
            },
            data: {
              status: status as any,
              updatedAt: new Date()
            }
          });
        },
        { operation: 'bulk_user_status_update' }
      );

      // Log audit event
      AuditService.logCRUDEvent(
        updatedBy,
        'update',
        'USER_BULK',
        'bulk_update',
        {
          userIds,
          status,
          count: userIds.length.toString()
        }
      );

      // Log performance metric
      const duration = Date.now() - startTime;
      AuditService.logPerformanceMetric(
        'bulk_user_update_duration',
        duration,
        'ms',
        'ADMIN',
        { count: userIds.length, status }
      );

      return users;
    } catch (error) {
      throw new Error(`Failed to bulk update user statuses: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default UserService; 