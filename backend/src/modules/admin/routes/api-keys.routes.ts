import { Express, Request, Response } from 'express';
import { createError } from '../../../shared/middleware/error-handler';
import { 
  withOrganization, 
  requirePermission,
  requireRole,
  RBACRequest
} from '../../../shared/middleware/rbac.middleware';
import { authenticateToken, AuthenticatedRequest } from '../../../shared/middleware/auth.middleware';
import { prisma } from '../../../shared/database/prisma';
import { withQueryLogging } from '../../../shared/middleware/db-logger';
import AuditService from '../../../shared/services/audit.service';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export function setupAPIKeyRoutes(app: Express, prefix: string): void {
  console.log(`Setting up API key routes with prefix: ${prefix}`);
  
  // Test endpoint to verify route is working
  app.get(`${prefix}/api-keys/test`, (req: Request, res: Response) => {
    console.log(`GET ${prefix}/api-keys/test - Test endpoint hit`);
    res.json({
      success: true,
      message: 'API Keys route is working',
      prefix: prefix,
      timestamp: new Date().toISOString()
    });
  });
  
  // Get API keys (super admin sees all, regular admin sees only their organization)
  app.get(`${prefix}/api-keys`,
    authenticateToken,
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    async (req: AuthenticatedRequest, res: Response) => {
      console.log(`GET ${prefix}/api-keys - Request received`);
      try {
        // Check if user is super admin or regular admin
        const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
        const userOrganizationId = req.user!.organizationId;
        
        console.log('User role and organization:', { role: req.user!.role, organizationId: userOrganizationId, isSuperAdmin });
        
        const apiKeys = await withQueryLogging(
          'get_api_keys',
          { admin: true, isSuperAdmin, userOrganizationId },
          async () => {
            return await prisma.aPIKey.findMany({
              where: isSuperAdmin ? {} : { organizationId: userOrganizationId },
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true
                  }
                },
                organization: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            });
          },
          { operation: 'api_key_listing' }
        );

        console.log(`Found ${apiKeys.length} API keys`);

        // Transform the data to match the frontend expectations
        const transformedApiKeys = apiKeys.map(key => ({
          id: key.id,
          name: key.name,
          keyHash: key.keyHash,
          status: key.status,
          permissions: key.scopes || [],
          userId: key.userId,
          userName: key.user ? `${key.user.firstName} ${key.user.lastName}` : 'Unknown',
          organizationId: key.organizationId,
          organizationName: key.organization ? key.organization.name : 'Unknown',
          createdAt: key.createdAt,
          lastUsedAt: key.lastUsedAt,
          expiresAt: key.expiresAt
        }));

        res.json({
          success: true,
          data: transformedApiKeys,
          count: transformedApiKeys.length
        });
      } catch (error: any) {
        console.error('Error in API keys route:', error);
        if (error.statusCode) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  );

  // Create new API key
  app.post(`${prefix}/api-keys`,
    authenticateToken,
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { name, userId, scopes, expiresAt, organizationId } = req.body;

        if (!name || !userId || !scopes || !Array.isArray(scopes)) {
          throw createError('Name, userId, and scopes array are required', 400);
        }

        // Check if user is super admin or regular admin
        const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
        const userOrganizationId = req.user!.organizationId;
        
        // Determine which organization to use for the API key
        let targetOrganizationId: string;
        if (isSuperAdmin) {
          // Super admin can specify any organization or use their own
          targetOrganizationId = organizationId || userOrganizationId || '';
          if (!targetOrganizationId) {
            throw createError('No valid organization ID found', 400);
          }
        } else {
          // Regular admin can only create keys for their own organization
          targetOrganizationId = userOrganizationId || '';
          if (!targetOrganizationId) {
            throw createError('User organization not found', 400);
          }
          
          // If they try to specify a different organization, reject it
          if (organizationId && organizationId !== userOrganizationId) {
            throw createError('You can only create API keys for your own organization', 403);
          }
        }

        console.log('Creating API key:', { 
          isSuperAdmin, 
          userOrganizationId, 
          targetOrganizationId, 
          requestedOrganizationId: organizationId 
        });

        // Generate API key
        const apiKey = crypto.randomBytes(32).toString('hex');
        const keyHash = await bcrypt.hash(apiKey, 12);

        const apiKeyRecord = await withQueryLogging(
          'create_api_key',
          { name, userId, scopes, expiresAt, targetOrganizationId },
          async () => {
            return await prisma.aPIKey.create({
              data: {
                name,
                keyHash,
                organizationId: targetOrganizationId,
                userId,
                scopes: scopes as any[],
                status: 'ACTIVE',
                expiresAt: expiresAt ? new Date(expiresAt) : null
              },
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            });
          },
          { operation: 'api_key_creation' }
        );

        // Log audit event
        AuditService.logCRUDEvent(
          req.user!.id,
          'create',
          'API_KEY',
          apiKeyRecord.id,
          {
            name,
            userId,
            scopes,
            expiresAt
          }
        );

        // Return the API key only once (it won't be stored in plain text)
        return res.status(201).json({
          success: true,
          message: 'API key created successfully',
          data: {
            ...apiKeyRecord,
            apiKey, // Only returned once
            keyHash: undefined // Don't return the hash
          },
          warning: 'Store this API key securely. It will not be shown again.'
        });
      } catch (error: any) {
        if (error.statusCode) {
          return res.status(error.statusCode).json({ error: error.message });
        } else {
          return res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  );

  // Update API key
  app.put(`${prefix}/api-keys/:id`,
    authenticateToken,
    withOrganization,
    requirePermission(['USERS_WRITE']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id } = req.params;
        const { name, scopes, status, expiresAt } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (scopes) updateData.scopes = scopes;
        if (status) updateData.status = status as any;
        if (expiresAt) updateData.expiresAt = new Date(expiresAt);

        const apiKey = await withQueryLogging(
          'update_api_key',
          { id, updateData },
          async () => {
            return await prisma.aPIKey.update({
              where: { id },
              data: updateData,
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            });
          },
          { operation: 'api_key_update' }
        );

        // Log audit event
        AuditService.logCRUDEvent(
          req.user!.id,
          'update',
          'API_KEY',
          id,
          updateData
        );

        return res.json({
          success: true,
          message: 'API key updated successfully',
          data: apiKey
        });
      } catch (error: any) {
        if (error.statusCode) {
          return res.status(error.statusCode).json({ error: error.message });
        } else {
          return res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  );

  // Delete API key
  app.delete(`${prefix}/api-keys/:id`,
    authenticateToken,
    withOrganization,
    requirePermission(['USERS_DELETE']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id } = req.params;
        
        const apiKey = await withQueryLogging(
          'delete_api_key',
          { id },
          async () => {
            return await prisma.aPIKey.update({
              where: { id },
              data: { status: 'REVOKED' }
            });
          },
          { operation: 'api_key_deletion' }
        );

        // Log audit event
        AuditService.logCRUDEvent(
          req.user!.id,
          'delete',
          'API_KEY',
          id,
          {
            name: apiKey.name,
            status: 'REVOKED'
          }
        );

        return res.json({
          success: true,
          message: 'API key revoked successfully',
          data: apiKey
        });
      } catch (error: any) {
        if (error.statusCode) {
          return res.status(error.statusCode).json({ error: error.message });
        } else {
          return res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  );
}

export default setupAPIKeyRoutes; 