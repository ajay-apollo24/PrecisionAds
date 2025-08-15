import { Express, Request, Response } from 'express';
import { createError } from '../../../shared/middleware/error-handler';
import { 
  withOrganization, 
  requirePermission,
  requireRole 
} from '../../../shared/middleware/rbac.middleware';
import { authenticateToken, AuthenticatedRequest } from '../../../modules/shared/middleware/auth.middleware';
import { prisma } from '../../../shared/database/prisma';
import { withQueryLogging } from '../../../shared/middleware/db-logger';
import AuditService from '../../../shared/services/audit.service';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export function setupAPIKeyRoutes(app: Express, prefix: string): void {
  // Get all API keys for organization
  app.get(`${prefix}/api-keys`,
    authenticateToken,
    withOrganization,
    requirePermission(['USERS_READ']),
    async (req: Request, res: Response) => {
      try {
        const apiKeys = await withQueryLogging(
          'get_api_keys',
          { organizationId: req.organizationId },
          async () => {
            return await prisma.aPIKey.findMany({
              where: { organizationId: req.organizationId },
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            });
          },
          { operation: 'api_key_listing' }
        );

        res.json({
          success: true,
          data: apiKeys,
          count: apiKeys.length
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

  // Create new API key
  app.post(`${prefix}/api-keys`,
    authenticateToken,
    withOrganization,
    requirePermission(['USERS_WRITE']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { name, userId, scopes, expiresAt } = req.body;

        if (!name || !userId || !scopes || !Array.isArray(scopes)) {
          throw createError('Name, userId, and scopes array are required', 400);
        }

        // Generate API key
        const apiKey = crypto.randomBytes(32).toString('hex');
        const keyHash = await bcrypt.hash(apiKey, 12);

        const apiKeyRecord = await withQueryLogging(
          'create_api_key',
          { name, userId, scopes, expiresAt },
          async () => {
            return await prisma.aPIKey.create({
              data: {
                name,
                keyHash,
                organizationId: req.organizationId!,
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
        res.status(201).json({
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
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
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

        res.json({
          success: true,
          message: 'API key updated successfully',
          data: apiKey
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

        res.json({
          success: true,
          message: 'API key revoked successfully',
          data: apiKey
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

export default setupAPIKeyRoutes; 