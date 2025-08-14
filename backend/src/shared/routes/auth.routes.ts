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
          status: 'PENDING'
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
    } catch (error) {
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
      const { email, password } = req.body;

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

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
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

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organization: user.organization
        }
      });
    } catch (error) {
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

      res.json({
        user: {
          id: session.user.id,
          email: session.user.email,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          role: session.user.role,
          organization: session.user.organization
        }
      });
    } catch (error) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
} 