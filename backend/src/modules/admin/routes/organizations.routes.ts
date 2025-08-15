import { Express, Request, Response } from 'express';
import OrganizationService from '../services/organization.service';
import { createError } from '../../../shared/middleware/error-handler';
import { 
  withOrganization, 
  requirePermission, 
  requireRole,
  canAccessResource 
} from '../../../shared/middleware/rbac.middleware';
import { authenticateToken, AuthenticatedRequest } from '../../../modules/shared/middleware/auth.middleware';

export function setupOrganizationRoutes(app: Express, prefix: string): void {
  // Get all organizations (admin only)
  app.get(`${prefix}/organizations`, 
    authenticateToken,
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    async (req: Request, res: Response) => {
      try {
        const { orgType, status, domain } = req.query;
        
        const filters = {
          orgType: orgType as string,
          status: status as string,
          domain: domain as string
        };

        const organizations = await OrganizationService.getOrganizations(filters);

        res.json({
          success: true,
          data: organizations,
          count: organizations.length
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

  // Get organizations with metrics (admin only)
  app.get(`${prefix}/organizations/metrics`,
    authenticateToken,
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    async (req: Request, res: Response) => {
      try {
        const organizations = await OrganizationService.getOrganizationsWithMetrics();

        res.json({
          success: true,
          data: organizations,
          count: organizations.length
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

  // Get organization by ID
  app.get(`${prefix}/organizations/:id`,
    authenticateToken,
    withOrganization,
    requirePermission(['ORG_READ']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const organization = await OrganizationService.getOrganizationById(id);

        if (!organization) {
          throw createError('Organization not found', 404);
        }

        res.json({
          success: true,
          data: organization
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

  // Create new organization (super admin only)
  app.post(`${prefix}/organizations`,
    authenticateToken,
    requireRole(['SUPER_ADMIN']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { name, orgType, domain, settings } = req.body;

        if (!name || !orgType) {
          throw createError('Name and organization type are required', 400);
        }

        const organization = await OrganizationService.createOrganization(
          { name, orgType, domain, settings },
          req.user!.id
        );

        res.status(201).json({
          success: true,
          message: 'Organization created successfully',
          data: organization
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

  // Update organization
  app.put(`${prefix}/organizations/:id`,
    authenticateToken,
    withOrganization,
    requirePermission(['ORG_WRITE']),
    canAccessResource('organization'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id } = req.params;
        const { name, orgType, domain, status, settings } = req.body;

        const updateData = {
          name,
          orgType,
          domain,
          status,
          settings
        };

        const organization = await OrganizationService.updateOrganization(
          id,
          updateData,
          req.user!.id
        );

        res.json({
          success: true,
          message: 'Organization updated successfully',
          data: organization
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

  // Delete organization (soft delete)
  app.delete(`${prefix}/organizations/:id`,
    authenticateToken,
    withOrganization,
    requirePermission(['ORG_DELETE']),
    canAccessResource('organization'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id } = req.params;
        const organization = await OrganizationService.deleteOrganization(
          id,
          req.user!.id
        );

        res.json({
          success: true,
          message: 'Organization deleted successfully',
          data: organization
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

  // Get organization statistics
  app.get(`${prefix}/organizations/:id/stats`,
    authenticateToken,
    withOrganization,
    requirePermission(['ORG_READ']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const stats = await OrganizationService.getOrganizationStats(id);

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

  // Bulk operations on organizations (super admin only)
  app.post(`${prefix}/organizations/bulk/status`,
    authenticateToken,
    requireRole(['SUPER_ADMIN']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { organizationIds, status } = req.body;

        if (!organizationIds || !Array.isArray(organizationIds) || !status) {
          throw createError('Organization IDs array and status are required', 400);
        }

        const results = [];
        const errors = [];

        for (const orgId of organizationIds) {
          try {
            const organization = await OrganizationService.updateOrganization(
              orgId,
              { status },
              req.user!.id
            );
            results.push({ id: orgId, status: 'success', data: organization });
          } catch (error) {
            errors.push({ 
              id: orgId, 
              status: 'error', 
              error: error instanceof Error ? error.message : String(error) 
            });
          }
        }

        res.json({
          success: true,
          message: 'Bulk operation completed',
          results: {
            total: organizationIds.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors
          }
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

export default setupOrganizationRoutes; 