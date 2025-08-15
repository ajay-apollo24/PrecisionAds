import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/prisma';
import { createError } from './error-handler';
import { PermissionScope } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
  };
  organizationId?: string;
}

export interface RBACRequest extends AuthenticatedRequest {
  requiredPermissions?: PermissionScope[];
}

/**
 * Middleware to extract and validate organization context
 */
export const withOrganization = async (
  req: RBACRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get organization ID from header or user context
    const headerOrgId = req.headers['x-organization-id'] as string;
    const userOrgId = req.user?.organizationId;

    if (!headerOrgId && !userOrgId) {
      throw createError('Organization ID required', 400);
    }

    // Validate organization exists and user has access
    const organizationId = headerOrgId || userOrgId;
    
    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    // Check if organization exists
    const organization = await (prisma as any).organization.findUnique({
      where: { id: organizationId },
      select: { id: true, status: true }
    });

    if (!organization) {
      throw createError('Organization not found', 404);
    }

    if (organization.status !== 'ACTIVE') {
      throw createError('Organization is not active', 403);
    }

    // Check user access to organization
    if (req.user) {
      // Super admins can access all organizations
      if (req.user.role === 'SUPER_ADMIN') {
        req.organizationId = organizationId;
        return next();
      }

      // Users can only access their own organization
      if (req.user.organizationId !== organizationId) {
        throw createError('Access denied to this organization', 403);
      }
    }

    req.organizationId = organizationId;
    next();
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      res.status((error as any).statusCode).json({ error: (error as any).message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Middleware to require specific permissions
 */
export const requirePermission = (permissions: PermissionScope[]) => {
  return async (req: RBACRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      if (!req.organizationId) {
        throw createError('Organization context required', 400);
      }

      // Super admins have all permissions
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Check if this is an API key request (user.email will be empty for API key requests)
      if (req.user.email === '') {
        // For API key requests, check the API key scopes directly
        const apiKey = req.headers['x-api-key'] as string;
        if (apiKey) {
          // Find all active API keys for this organization
          const allKeys = await (prisma as any).aPIKey.findMany({
            where: {
              status: 'ACTIVE',
              expiresAt: { gte: new Date() },
              organizationId: req.organizationId
            }
          });

          // Find the matching key by comparing hashes
          const bcrypt = require('bcryptjs');
          let matchingKey = null;
          
          for (const key of allKeys) {
            if (await bcrypt.compare(apiKey, key.keyHash)) {
              matchingKey = key;
              break;
            }
          }

          if (matchingKey && matchingKey.scopes) {
            console.log('🔑 API Key scopes:', matchingKey.scopes);
            console.log('🔒 Required permissions:', permissions);
            
            const hasAllPermissions = permissions.every(permission => 
              matchingKey.scopes.includes(permission)
            );
            
            console.log('✅ Has all permissions:', hasAllPermissions);
            
            if (hasAllPermissions) {
              return next();
            } else {
              throw createError('Insufficient permissions', 403);
            }
          } else {
            throw createError('Invalid API key', 401);
          }
        } else {
          throw createError('API key required', 401);
        }
      }

      // For user requests, check user permissions
      const userPermissions = await (prisma as any).userPermission.findMany({
        where: {
          userId: req.user.id,
          isActive: true,
          expiresAt: {
            gte: new Date()
          },
          permission: {
            organizationId: req.organizationId,
            isActive: true,
            scope: {
              in: permissions
            }
          }
        },
        include: {
          permission: {
            select: {
              scope: true
            }
          }
        }
      });

      const userScopes = userPermissions.map((up: any) => up.permission.scope);
      const hasAllPermissions = permissions.every(permission => userScopes.includes(permission));

      if (!hasAllPermissions) {
        throw createError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        res.status((error as any).statusCode).json({ error: (error as any).message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
};

/**
 * Middleware to require specific role
 */
export const requireRole = (roles: string[]) => {
  return (req: RBACRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      if (!roles.includes(req.user.role)) {
        throw createError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        res.status((error as any).statusCode).json({ error: (error as any).message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
};

/**
 * Middleware to check if user can access specific resource
 */
export const canAccessResource = (resourceType: string, resourceIdField: string = 'id') => {
  return async (req: RBACRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      if (!req.organizationId) {
        throw createError('Organization context required', 400);
      }

      // Super admins can access all resources
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      const resourceId = req.params[resourceIdField] || req.body[resourceIdField];
      
      if (!resourceId) {
        throw createError('Resource ID required', 400);
      }

      // Check if resource belongs to user's organization
      const resource = await prisma[resourceType as any].findUnique({
        where: { id: resourceId },
        select: { organizationId: true }
      });

      if (!resource) {
        throw createError('Resource not found', 404);
      }

      if (resource.organizationId !== req.organizationId) {
        throw createError('Access denied to this resource', 403);
      }

      next();
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        res.status((error as any).statusCode).json({ error: (error as any).message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
};

/**
 * Middleware to validate API key and set organization context
 */
export const validateAPIKey = async (
  req: RBACRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw createError('API key required', 401);
    }

    // Find all active API keys for comparison
    const allKeys = await (prisma as any).aPIKey.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          gte: new Date()
        }
      },
      include: {
        organization: {
          select: { id: true, status: true }
        },
        user: {
          select: { id: true, role: true, status: true }
        }
      }
    });

    // Find the matching key by comparing hashes
    const bcrypt = require('bcryptjs');
    let keyRecord = null;
    
    for (const key of allKeys) {
      if (await bcrypt.compare(apiKey, key.keyHash)) {
        keyRecord = key;
        break;
      }
    }

    if (!keyRecord) {
      throw createError('Invalid or expired API key', 401);
    }

    if (keyRecord.organization.status !== 'ACTIVE') {
      throw createError('Organization is not active', 403);
    }

    if (keyRecord.user.status !== 'ACTIVE') {
      throw createError('User account is not active', 403);
    }

    // Set organization context
    req.organizationId = keyRecord.organization.id;
    
    // Set user context for API key requests
    req.user = {
      id: keyRecord.user.id,
      email: '', // Not available for API key requests
      role: keyRecord.user.role,
      organizationId: keyRecord.organization.id
    };

    // Update last used timestamp
    await (prisma as any).aPIKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() }
    });

    next();
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      res.status((error as any).statusCode).json({ error: (error as any).message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Helper function to check if user has specific permission
 */
export const hasPermission = async (
  userId: string,
  organizationId: string,
  permission: PermissionScope
): Promise<boolean> => {
  try {
    const userPermission = await prisma.userPermission.findFirst({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gte: new Date()
        },
        permission: {
          organizationId,
          isActive: true,
          scope: permission
        }
      }
    });

    return !!userPermission;
  } catch (error) {
    return false;
  }
};

/**
 * Helper function to get user permissions
 */
export const getUserPermissions = async (
  userId: string,
  organizationId: string
): Promise<PermissionScope[]> => {
  try {
    const userPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gte: new Date()
        },
        permission: {
          organizationId,
          isActive: true
        }
      },
      include: {
        permission: {
          select: {
            scope: true
          }
        }
      }
    });

    return userPermissions.map(up => up.permission.scope);
  } catch (error) {
    return [];
  }
};

export default {
  withOrganization,
  requirePermission,
  requireRole,
  canAccessResource,
  validateAPIKey,
  hasPermission,
  getUserPermissions
}; 