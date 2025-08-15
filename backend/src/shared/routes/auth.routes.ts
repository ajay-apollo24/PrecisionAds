import { Express, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/prisma';
import { createError } from '../middleware/error-handler';

export function setupAuthRoutes(app: Express, prefix: string): void {
  // User registration
  app.post(`${prefix}/register`, async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, role, organizationName, orgType } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !role) {
        throw createError('Missing required fields', 400);
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw createError('User already exists', 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create organization if provided
      let organizationId: string | undefined;
      if (organizationName && orgType) {
        const organization = await prisma.organization.create({
          data: {
            name: organizationName,
            orgType,
            status: 'ACTIVE'
          }
        });
        organizationId = organization.id;
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          organizationId,
          status: 'ACTIVE' // Changed from PENDING to ACTIVE for demo
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          organizationId: true,
          createdAt: true
        }
      });

      res.status(201).json({
        message: 'User registered successfully',
        user
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // User login
  app.post(`${prefix}/login`, async (req: Request, res: Response) => {
    try {
      const { email, password, organizationId } = req.body;

      // Validate required fields
      if (!email || !password) {
        throw createError('Email and password are required', 400);
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          organization: true
        }
      });

      if (!user) {
        throw createError('Invalid credentials', 401);
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw createError('Invalid credentials', 401);
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        throw createError('Account is not active', 403);
      }

      // If organizationId is provided, verify user belongs to that organization
      if (organizationId && user.organizationId !== organizationId) {
        throw createError('User does not belong to the specified organization', 403);
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Create session
      await prisma.userSession.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        }
      });

      // Map backend role to frontend role
      const frontendRole = mapBackendRoleToFrontend(user.role);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: frontendRole,
          organizationId: user.organizationId,
          organizationName: user.organization?.name || ''
        }
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // User logout
  app.post(`${prefix}/logout`, async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        // Invalidate session
        await prisma.userSession.deleteMany({
          where: { token }
        });
      }

      res.json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get current user
  app.get(`${prefix}/me`, async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw createError('No token provided', 401);
      }

      // Find session
      const session = await prisma.userSession.findUnique({
        where: { token },
        include: {
          user: {
            include: {
              organization: true
            }
          }
        }
      });

      if (!session || session.expiresAt < new Date()) {
        throw createError('Invalid or expired token', 401);
      }

      // Map backend role to frontend role
      const frontendRole = mapBackendRoleToFrontend(session.user.role);

      res.json({
        user: {
          id: session.user.id,
          name: `${session.user.firstName} ${session.user.lastName}`,
          email: session.user.email,
          role: frontendRole,
          organizationId: session.user.organizationId,
          organizationName: session.user.organization?.name || ''
        }
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Validate token
  app.get(`${prefix}/validate`, async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw createError('No token provided', 401);
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      // Check if session exists and is valid
      const session = await prisma.userSession.findUnique({
        where: { token }
      });

      if (!session || session.expiresAt < new Date()) {
        throw createError('Invalid or expired token', 401);
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          organization: true
        }
      });

      if (!user || user.status !== 'ACTIVE') {
        throw createError('User not found or inactive', 401);
      }

      res.json({
        valid: true,
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: mapBackendRoleToFrontend(user.role),
          organizationId: user.organizationId,
          organizationName: user.organization?.name || ''
        }
      });
    } catch (error: any) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ valid: false, error: 'Invalid token' });
      } else if (error.statusCode) {
        res.status(error.statusCode).json({ valid: false, error: error.message });
      } else {
        res.status(500).json({ valid: false, error: 'Internal server error' });
      }
    }
  });

  // Refresh token
  app.post(`${prefix}/refresh`, async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw createError('No token provided', 401);
      }

      // Verify current token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      // Check if session exists
      const session = await prisma.userSession.findUnique({
        where: { token }
      });

      if (!session || session.expiresAt < new Date()) {
        throw createError('Invalid or expired token', 401);
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          organization: true
        }
      });

      if (!user || user.status !== 'ACTIVE') {
        throw createError('User not found or inactive', 401);
      }

      // Generate new token
      const newToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      // Update session with new token
      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          token: newToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      res.json({
        message: 'Token refreshed successfully',
        token: newToken
      });
    } catch (error: any) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token' });
      } else if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get organizations for login
  app.get(`${prefix}/organizations`, async (req: Request, res: Response) => {
    try {
      const organizations = await prisma.organization.findMany({
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          orgType: true,
          status: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      res.json({
        success: true,
        organizations
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch organizations' });
    }
  });
}

// Helper function to map backend roles to frontend roles
function mapBackendRoleToFrontend(backendRole: string): string {
  const roleMap: { [key: string]: string } = {
    'SUPER_ADMIN': 'super_admin',
    'ADMIN': 'admin',
    'ADVERTISER': 'advertiser',
    'PUBLISHER': 'publisher',
    'ANALYST': 'advertiser', // Map to advertiser for now
    'MANAGER': 'advertiser', // Map to advertiser for now
    'VIEWER': 'publisher'    // Map to publisher for now
  };

  return roleMap[backendRole] || 'advertiser';
} 