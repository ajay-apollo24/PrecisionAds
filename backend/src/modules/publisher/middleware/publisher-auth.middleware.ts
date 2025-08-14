import { Request, Response, NextFunction } from 'express';
import { createError } from '../../../shared/middleware/error-handler';

export interface PublisherRequest extends Request {
  publisherId?: string;
  organizationId?: string;
}

/**
 * Middleware to verify that the user has publisher access
 */
export function requirePublisherAccess(req: PublisherRequest, res: Response, next: NextFunction): void {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const userRole = req.headers['x-user-role'] as string;

    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    if (!userRole) {
      throw createError('User role required', 400);
    }

    // Check if user has publisher role or is admin
    if (!['PUBLISHER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw createError('Publisher access required', 403);
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
}

/**
 * Middleware to verify site ownership
 */
export function requireSiteOwnership(req: PublisherRequest, res: Response, next: NextFunction): void {
  try {
    const { siteId } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    if (!siteId) {
      throw createError('Site ID required', 400);
    }

    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    // In a real implementation, you would verify that the site belongs to the organization
    // For now, we'll just pass through
    req.organizationId = organizationId;
    next();
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      res.status((error as any).statusCode).json({ error: (error as any).message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

/**
 * Middleware to verify ad unit ownership
 */
export function requireAdUnitOwnership(req: PublisherRequest, res: Response, next: NextFunction): void {
  try {
    const { adUnitId } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    if (!adUnitId) {
      throw createError('Ad unit ID required', 400);
    }

    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    // In a real implementation, you would verify that the ad unit belongs to the organization
    // For now, we'll just pass through
    req.organizationId = organizationId;
    next();
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      res.status((error as any).statusCode).json({ error: (error as any).message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

/**
 * Middleware to check publisher permissions
 */
export function checkPublisherPermissions(permissions: string[]) {
  return (req: PublisherRequest, res: Response, next: NextFunction): void => {
    try {
      const userRole = req.headers['x-user-role'] as string;
      const userPermissions = req.headers['x-user-permissions'] as string;

      if (!userRole) {
        throw createError('User role required', 400);
      }

      // Super admin has all permissions
      if (userRole === 'SUPER_ADMIN') {
        return next();
      }

      // Admin has most permissions
      if (userRole === 'ADMIN') {
        return next();
      }

      // Check specific permissions for publisher
      if (userRole === 'PUBLISHER') {
        if (userPermissions) {
          const userPerms = userPermissions.split(',');
          const hasAllPermissions = permissions.every(permission => userPerms.includes(permission));
          
          if (!hasAllPermissions) {
            throw createError('Insufficient permissions', 403);
          }
        } else {
          // Default publisher permissions
          const defaultPublisherPermissions = ['READ_SITES', 'WRITE_SITES', 'READ_AD_UNITS', 'WRITE_AD_UNITS'];
          const hasAllPermissions = permissions.every(permission => defaultPublisherPermissions.includes(permission));
          
          if (!hasAllPermissions) {
            throw createError('Insufficient permissions', 403);
          }
        }
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
} 