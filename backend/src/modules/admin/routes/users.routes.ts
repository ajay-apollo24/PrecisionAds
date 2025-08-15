import { Express, Request, Response } from 'express';
import UserService from '../services/user.service';
import { createError } from '../../../shared/middleware/error-handler';
import { 
  withOrganization, 
  requirePermission, 
  requireRole,
  canAccessResource 
} from '../../../shared/middleware/rbac.middleware';
import { authenticateToken, AuthenticatedRequest } from '../../../shared/middleware/auth.middleware';

export function setupUserRoutes(app: Express, prefix: string): void {
  console.log(`Setting up user routes with prefix: ${prefix}`);
  
  // Test endpoint to verify route is working
  app.get(`${prefix}/users/test`, (req: Request, res: Response) => {
    console.log(`GET ${prefix}/users/test - Test endpoint hit`);
    res.json({
      success: true,
      message: 'Users route is working',
      prefix: prefix,
      timestamp: new Date().toISOString()
    });
  });
  
  // Get users (super admin sees all, regular admin sees only their organization)
  app.get(`${prefix}/users`, 
    authenticateToken,
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    async (req: AuthenticatedRequest, res: Response) => {
      console.log(`GET ${prefix}/users - Request received`);
      try {
        const { role, status, organizationId, email } = req.query;
        
        // Check if user is super admin or regular admin
        const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
        const userOrganizationId = req.user!.organizationId;
        
        console.log('User role and organization:', { role: req.user!.role, organizationId: userOrganizationId, isSuperAdmin });
        
        const filters = {
          role: role as string,
          status: status as string,
          organizationId: isSuperAdmin ? (organizationId as string) : userOrganizationId,
          email: email as string
        };

        console.log('Fetching users with filters:', filters);
        const users = await UserService.getUsers(filters);
        console.log(`Found ${users.length} users`);

        res.json({
          success: true,
          data: users,
          count: users.length
        });
      } catch (error: any) {
        console.error('Error in users route:', error);
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
      console.log(`POST ${prefix}/users - User creation request received`);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Authenticated user:', req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : 'No user');
      
      try {
        const { email, password, firstName, lastName, role, status, organizationId, permissions } = req.body;

        if (!email || !password || !firstName || !lastName || !role) {
          console.log('Validation failed - missing required fields');
          throw createError('Email, password, first name, last name, and role are required', 400);
        }

        console.log('Creating user with data:', { email, firstName, lastName, role, status, organizationId, permissions: permissions ? 'provided' : 'not provided' });

        const user = await UserService.createUser(
          { email, password, firstName, lastName, role, status, organizationId, permissions },
          req.user!.id
        );

        console.log('User created successfully:', { id: user.id, email: user.email });

        res.status(201).json({
          success: true,
          message: 'User created successfully',
          data: user
        });
      } catch (error: any) {
        console.error('Error in user creation route:', error);
        console.error('Error details:', {
          message: error.message,
          statusCode: error.statusCode,
          stack: error.stack
        });
        
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