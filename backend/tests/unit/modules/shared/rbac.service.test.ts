import { RBACService } from '../../../../src/shared/services/rbac.service';
import { prisma } from '../../../../src/shared/database/prisma';
import { createError } from '../../../../src/shared/middleware/error-handler';

// Mock Prisma
jest.mock('../../../../src/shared/database/prisma', () => ({
  prisma: {
    userRole: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    rolePermission: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock error handler
jest.mock('../../../../src/shared/middleware/error-handler', () => ({
  createError: jest.fn(),
}));

describe('RBACService', () => {
  let rbacService: RBACService;
  let mockPrisma: any;
  let mockCreateError: any;

  beforeEach(() => {
    jest.clearAllMocks();
    rbacService = new RBACService();
    mockPrisma = prisma;
    mockCreateError = createError;
  });

  describe('getUserRoles', () => {
    it('should return user roles', async () => {
      const mockRoles = [
        { id: 'role-1', name: 'Admin', description: 'Administrator role' },
        { id: 'role-2', name: 'User', description: 'Regular user role' },
      ];

      (mockPrisma.userRole.findMany as jest.Mock).mockResolvedValue(mockRoles);

      const result = await rbacService.getUserRoles('user-1');

      expect(result).toEqual(mockRoles);
      expect(mockPrisma.userRole.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { role: true },
      });
    });

    it('should handle empty roles', async () => {
      (mockPrisma.userRole.findMany as jest.Mock).mockResolvedValue([]);

      const result = await rbacService.getUserRoles('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('checkPermission', () => {
    it('should return true when user has permission', async () => {
      const mockRolePermissions = [
        { permission: { name: 'read:users' } },
        { permission: { name: 'write:users' } },
      ];

      (mockPrisma.userRole.findMany as jest.Mock).mockResolvedValue([
        { roleId: 'role-1' },
      ]);
      (mockPrisma.rolePermission.findMany as jest.Mock).mockResolvedValue(mockRolePermissions);

      const result = await rbacService.checkPermission('user-1', 'read:users');

      expect(result).toBe(true);
    });

    it('should return false when user does not have permission', async () => {
      const mockRolePermissions = [
        { permission: { name: 'read:users' } },
      ];

      (mockPrisma.userRole.findMany as jest.Mock).mockResolvedValue([
        { roleId: 'role-1' },
      ]);
      (mockPrisma.rolePermission.findMany as jest.Mock).mockResolvedValue(mockRolePermissions);

      const result = await rbacService.checkPermission('user-1', 'write:users');

      expect(result).toBe(false);
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', async () => {
      const mockAssignedRole = { id: 'user-role-1', userId: 'user-1', roleId: 'role-1' };

      (mockPrisma.userRole.create as jest.Mock).mockResolvedValue(mockAssignedRole);

      const result = await rbacService.assignRoleToUser('user-1', 'role-1');

      expect(result).toEqual(mockAssignedRole);
      expect(mockPrisma.userRole.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', roleId: 'role-1' },
      });
    });
  });

  describe('removeRoleFromUser', () => {
    it('should remove role from user successfully', async () => {
      (mockPrisma.userRole.delete as jest.Mock).mockResolvedValue({ id: 'user-role-1' });

      const result = await rbacService.removeRoleFromUser('user-1', 'role-1');

      expect(result).toEqual({ id: 'user-role-1' });
      expect(mockPrisma.userRole.delete).toHaveBeenCalledWith({
        where: { userId_roleId: { userId: 'user-1', roleId: 'role-1' } },
      });
    });
  });

  describe('getRolePermissions', () => {
    it('should return role permissions', async () => {
      const mockPermissions = [
        { permission: { name: 'read:users', description: 'Read user data' } },
        { permission: { name: 'write:users', description: 'Write user data' } },
      ];

      (mockPrisma.rolePermission.findMany as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await rbacService.getRolePermissions('role-1');

      expect(result).toEqual(mockPermissions);
      expect(mockPrisma.rolePermission.findMany).toHaveBeenCalledWith({
        where: { roleId: 'role-1' },
        include: { permission: true },
      });
    });
  });
}); 