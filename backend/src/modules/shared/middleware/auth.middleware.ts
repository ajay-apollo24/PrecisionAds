import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
  };
}

/**
 * Middleware to verify JWT token and authenticate user
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw createError('Access token required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        organizationId: true
      }
    });

    if (!user) {
      throw createError('User not found', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw createError('User account is not active', 401);
    }

          req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || undefined
      };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else if (error && typeof error === 'object' && 'statusCode' in error) {
      res.status((error as any).statusCode).json({ error: (error as any).message });
    } else {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
}

/**
 * Middleware to require specific user roles
 */
export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
}

/**
 * Middleware to require organization access
 */
export function requireOrganizationAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (!req.user.organizationId) {
      throw createError('Organization access required', 403);
    }

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
 * Middleware to check if user can access specific organization
 */
export function canAccessOrganization(organizationId: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      // Super admins can access all organizations
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Users can only access their own organization
      if (req.user.organizationId !== organizationId) {
        throw createError('Access denied to this organization', 403);
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

/**
 * Middleware to rate limit requests
 */
export function rateLimit(maxRequests: number, windowMs: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || 'unknown';
    const now = Date.now();

    const userRequests = requests.get(ip);
    
    if (!userRequests || now > userRequests.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

          if (userRequests.count >= maxRequests) {
        res.status(429).json({ 
          error: 'Too many requests',
          retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
        });
        return;
      }

    userRequests.count++;
    next();
  };
}

/**
 * Middleware to validate request body
 */
export function validateBody(schema: Record<string, { required?: boolean; type?: string; minLength?: number; maxLength?: number }>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Simple validation - in production, use a proper validation library like Joi or Zod
      if (!req.body || Object.keys(req.body).length === 0) {
        throw createError('Request body is required', 400);
      }

      // Basic schema validation
      for (const [key, rules] of Object.entries(schema)) {
        if (rules.required && !req.body[key]) {
          throw createError(`${key} is required`, 400);
        }

        if (req.body[key] && rules.type && typeof req.body[key] !== rules.type) {
          throw createError(`${key} must be of type ${rules.type}`, 400);
        }

        if (req.body[key] && rules.minLength && typeof req.body[key] === 'string' && req.body[key].length < rules.minLength) {
          throw createError(`${key} must be at least ${rules.minLength} characters`, 400);
        }

        if (req.body[key] && rules.maxLength && typeof req.body[key] === 'string' && req.body[key].length > rules.maxLength) {
          throw createError(`${key} must be at most ${rules.maxLength} characters`, 400);
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