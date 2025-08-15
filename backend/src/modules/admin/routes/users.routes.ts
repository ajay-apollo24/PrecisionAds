import { Express, Request, Response } from 'express';
import UserService from '../services/user.service';
import { createError } from '../../../shared/middleware/error-handler';
import { 
  withOrganization, 
  requirePermission, 
  requireRole,
  canAccessResource 
} from '../../../shared/middleware/rbac.middleware';
import { authenticateToken, AuthenticatedRequest } from '../../../modules/shared/middleware/auth.middleware';

export function setupUserRoutes(app: Express, prefix: string): void {
  // Get all users (admin only)
  app.get(`${prefix}/users`, 
    authenticateToken,
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    async (req: Request, res: Response) => {
      try {
        const { role, status, organizationId, email } = req.query;
        
        const filters = {
          role: role as string,
          status: status as string,
          organizationId: organizationId as string,
          email: email as string
        };

        const users = await UserService.getUsers(filters);

        res.json({
          success: true,
          data: users,
          count: users.length
        });
      } catch (error: any) {
        if (error.statusCode) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  );

  // Get users by role
  app.get(`${prefix}/users/role/:role`,
    authenticateToken,
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    async (req: Request, res: Response) => {
      try {
        const { role } = req.params;
        const { organizationId } = req.query;

        const users = await UserService.getUsersByRole(
          role, 
          organizationId as string
        );

        res.json({
          success: true,
          data: users,
          count: users.length
        });
      } catch (error: any) {
        if (error.statusCode) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  );

  // Get user by ID
  app.get(`${prefix}/users/:id`,
    authenticateToken,
    withOrganization,
    requirePermission(['USERS_READ']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const user = await UserService.getUserById(id);

        if (!user) {
          throw createError('User not found', 404);
        }

        res.json({
          success: true,
          data: user
        });
      } catch (error: any) {
        if (error.statusCode) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  );

  // Create new user
  app.post(`${prefix}/users`,
    authenticateToken,
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { email, password, firstName, lastName, role, organizationId, permissions } = req.body;

        if (!email || !password || !firstName || !lastName || !role) {
          throw createError('Email, password, first name, last name, and role are required', 400);
        }

        const user = await UserService.createUser(
          { email, password, firstName, lastName, role, organizationId, permissions },
          req.user!.id
        );

        res.status(201).json({
          success: true,
          message: 'User created successfully',
          data: user
        });
      } catch (error: any) {
        if (error.statusCode) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  );

  // Update user
  app.put(`${prefix}/users/:id`,
    authenticateToken,
    withOrganization,
    requirePermission(['USERS_WRITE']),
    canAccessResource('user'),
    async (req: AuthenticatedRequest, res: Response) => {
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

        const user = await UserService.updateUser(
          id,
          updateData,
          req.user!.id
        );

        res.json({
          success: true,
          message: 'User updated successfully',
          data: user
        });
      } catch (error: any) {
        if (error.statusCode) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  );

  // Delete user (soft delete)
  app.delete(`${prefix}/users/:id`,
    authenticateToken,
    withOrganization,
    requirePermission(['USERS_DELETE']),
    canAccessResource('user'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id } = req.params;
        const user = await UserService.deleteUser(
          id,
          req.user!.id
        );

        res.json({
          success: true,
          message: 'User deleted successfully',
          data: user
        });
      } catch (error: any) {
        if (error.statusCode) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  );

  // Reset user password
  app.post(`${prefix}/users/:id/reset-password`,
    authenticateToken,
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
          throw createError('New password is required', 400);
        }

        const user = await UserService.resetPassword(
          id,
          newPassword,
          req.user!.id
        );

        res.json({
          success: true,
          message: 'Password reset successfully',
          data: user
        });
      } catch (error: any) {
        if (error.statusCode) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  );

  // Get user statistics
  app.get(`${prefix}/users/stats`,
    authenticateToken,
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    async (req: Request, res: Response) => {
      try {
        const { organizationId } = req.query;
        const stats = await UserService.getUserStats(organizationId as string);

        res.json({
          success: true,
          data: stats
        });
      } catch (error: any) {
        if (error.statusCode) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  );

  // Bulk update user statuses
  app.post(`${prefix}/users/bulk/status`,
    authenticateToken,
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { userIds, status } = req.body;

        if (!userIds || !Array.isArray(userIds) || !status) {
          throw createError('User IDs array and status are required', 400);
        }

        const result = await UserService.bulkUpdateUserStatuses(
          userIds,
          status,
          req.user!.id
        );

        res.json({
          success: true,
          message: 'Bulk status update completed',
          data: result
        });
      } catch (error: any) {
        if (error.statusCode) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  );
}

export default setupUserRoutes; 