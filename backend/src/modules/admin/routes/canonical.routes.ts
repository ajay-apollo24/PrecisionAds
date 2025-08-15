import { Express, Request, Response } from 'express';
import { createError } from '../../../shared/middleware/error-handler';
import { 
  withOrganization, 
  requirePermission,
  validateAPIKey 
} from '../../../shared/middleware/rbac.middleware';
import { authenticateToken, AuthenticatedRequest } from '../../../modules/shared/middleware/auth.middleware';
import { prisma } from '../../../shared/database/prisma';
import { withQueryLogging } from '../../../shared/middleware/db-logger';
import AuditService from '../../../shared/services/audit.service';

export function setupCanonicalRoutes(app: Express, prefix: string): void {
  // Identity Management
  app.post(`${prefix}/identities`,
    [validateAPIKey, withOrganization],
    requirePermission(['INGEST_WRITE']),
    async (req: Request, res: Response) => {
      try {
        const {
          externalId,
          anonymousId,
          userId,
          traits,
          version = 1,
          idempotencyKey
        } = req.body;

        if (!req.organizationId) {
          throw createError('Organization context required', 400);
        }

        // Check for existing identity with same idempotency key
        if (idempotencyKey) {
          const existing = await prisma.identity.findFirst({
            where: {
              organizationId: req.organizationId,
              idempotencyKey
            }
          });

          if (existing) {
            return res.json({
              success: true,
              message: 'Identity already exists (idempotency)',
              data: existing
            });
          }
        }

        const identity = await withQueryLogging(
          'create_identity',
          { externalId, anonymousId, userId, traits, version, idempotencyKey },
          async () => {
            return await prisma.identity.create({
              data: {
                organizationId: req.organizationId!,
                externalId,
                anonymousId,
                userId,
                traits,
                version,
                idempotencyKey
              }
            });
          },
          { operation: 'identity_creation' }
        );

        // Log audit event
        AuditService.logCRUDEvent(
          req.user?.id || 'api_key',
          'create',
          'IDENTITY',
          identity.id,
          {
            externalId,
            anonymousId,
            userId,
            version,
            idempotencyKey
          }
        );

        res.status(201).json({
          success: true,
          message: 'Identity created successfully',
          data: identity
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

  // Get Identity
  app.get(`${prefix}/identities/:id`,
    [validateAPIKey, withOrganization],
    requirePermission(['INGEST_READ']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        
        const identity = await withQueryLogging(
          'get_identity',
          { id },
          async () => {
            return await prisma.identity.findUnique({
              where: { id },
              include: {
                traits: true,
                events: {
                  take: 10,
                  orderBy: { timestamp: 'desc' }
                }
              }
            });
          },
          { operation: 'identity_retrieval' }
        );

        if (!identity) {
          throw createError('Identity not found', 404);
        }

        res.json({
          success: true,
          data: identity
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

  // Trait Management
  app.post(`${prefix}/traits`,
    [validateAPIKey, withOrganization],
    requirePermission(['TRAITS_WRITE']),
    async (req: Request, res: Response) => {
      try {
        const {
          identityId,
          key,
          value,
          type = 'STRING',
          version = 1,
          idempotencyKey
        } = req.body;

        if (!req.organizationId || !identityId || !key || value === undefined) {
          throw createError('Organization context, identityId, key, and value are required', 400);
        }

        // Check for existing trait with same idempotency key
        if (idempotencyKey) {
          const existing = await prisma.trait.findFirst({
            where: {
              organizationId: req.organizationId,
              idempotencyKey
            }
          });

          if (existing) {
            return res.json({
              success: true,
              message: 'Trait already exists (idempotency)',
              data: existing
            });
          }
        }

        const trait = await withQueryLogging(
          'create_trait',
          { identityId, key, value, type, version, idempotencyKey },
          async () => {
            return await prisma.trait.create({
              data: {
                organizationId: req.organizationId!,
                identityId,
                key,
                value,
                type: type as any,
                version,
                idempotencyKey,
                createdBy: req.user?.id || 'api_key'
              }
            });
          },
          { operation: 'trait_creation' }
        );

        // Log audit event
        AuditService.logCRUDEvent(
          req.user?.id || 'api_key',
          'create',
          'TRAIT',
          trait.id,
          {
            identityId,
            key,
            type,
            version,
            idempotencyKey
          }
        );

        res.status(201).json({
          success: true,
          message: 'Trait created successfully',
          data: trait
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

  // Cohort Management
  app.post(`${prefix}/cohorts`,
    [validateAPIKey, withOrganization],
    requirePermission(['COHORTS_WRITE']),
    async (req: Request, res: Response) => {
      try {
        const {
          name,
          description,
          type = 'STATIC',
          criteria,
          members,
          version = 1,
          idempotencyKey
        } = req.body;

        if (!req.organizationId || !name || !criteria) {
          throw createError('Organization context, name, and criteria are required', 400);
        }

        // Check for existing cohort with same idempotency key
        if (idempotencyKey) {
          const existing = await prisma.cohort.findFirst({
            where: {
              organizationId: req.organizationId,
              idempotencyKey
            }
          });

          if (existing) {
            return res.json({
              success: true,
              message: 'Cohort already exists (idempotency)',
              data: existing
            });
          }
        }

        const cohort = await withQueryLogging(
          'create_cohort',
          { name, description, type, criteria, members, version, idempotencyKey },
          async () => {
            return await prisma.cohort.create({
              data: {
                organizationId: req.organizationId!,
                name,
                description,
                type: type as any,
                criteria,
                members,
                version,
                idempotencyKey,
                createdBy: req.user?.id || 'api_key'
              }
            });
          },
          { operation: 'cohort_creation' }
        );

        // Log audit event
        AuditService.logCRUDEvent(
          req.user?.id || 'api_key',
          'create',
          'COHORT',
          cohort.id,
          {
            name,
            type,
            version,
            idempotencyKey
          }
        );

        res.status(201).json({
          success: true,
          message: 'Cohort created successfully',
          data: cohort
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

  // Event Tracking
  app.post(`${prefix}/events`,
    [validateAPIKey, withOrganization],
    requirePermission(['INGEST_WRITE']),
    async (req: Request, res: Response) => {
      try {
        const {
          identityId,
          type,
          name,
          properties,
          timestamp,
          version = 1,
          idempotencyKey
        } = req.body;

        if (!req.organizationId || !identityId || !type || !name) {
          throw createError('Organization context, identityId, type, and name are required', 400);
        }

        // Check for existing event with same idempotency key
        if (idempotencyKey) {
          const existing = await prisma.event.findFirst({
            where: {
              organizationId: req.organizationId,
              idempotencyKey
            }
          });

          if (existing) {
            return res.json({
              success: true,
              message: 'Event already exists (idempotency)',
              data: existing
            });
          }
        }

        const event = await withQueryLogging(
          'create_event',
          { identityId, type, name, properties, timestamp, version, idempotencyKey },
          async () => {
            return await prisma.event.create({
              data: {
                organizationId: req.organizationId!,
                identityId,
                type: type as any,
                name,
                properties,
                timestamp: timestamp ? new Date(timestamp) : new Date(),
                version,
                idempotencyKey,
                createdBy: req.user?.id || 'api_key'
              }
            });
          },
          { operation: 'event_creation' }
        );

        // Log audit event
        AuditService.logCRUDEvent(
          req.user?.id || 'api_key',
          'create',
          'EVENT',
          event.id,
          {
            identityId,
            type,
            name,
            version,
            idempotencyKey
          }
        );

        res.status(201).json({
          success: true,
          message: 'Event tracked successfully',
          data: event
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

  // Batch Operations
  app.post(`${prefix}/batch`,
    [validateAPIKey, withOrganization],
    requirePermission(['INGEST_WRITE']),
    async (req: Request, res: Response) => {
      try {
        const { operations } = req.body;

        if (!req.organizationId || !Array.isArray(operations)) {
          throw createError('Organization context and operations array are required', 400);
        }

        const results = [];
        const errors = [];

        for (const operation of operations) {
          try {
            let result;
            
            switch (operation.type) {
              case 'identity':
                result = await prisma.identity.create({
                  data: {
                    organizationId: req.organizationId!,
                    externalId: operation.data.externalId,
                    anonymousId: operation.data.anonymousId,
                    userId: operation.data.userId,
                    traits: operation.data.traits,
                    version: operation.data.version || 1,
                    idempotencyKey: operation.data.idempotencyKey
                  }
                });
                break;

              case 'trait':
                result = await prisma.trait.create({
                  data: {
                    organizationId: req.organizationId!,
                    identityId: operation.data.identityId,
                    key: operation.data.key,
                    value: operation.data.value,
                    type: operation.data.type || 'STRING',
                    version: operation.data.version || 1,
                    idempotencyKey: operation.data.idempotencyKey,
                    createdBy: req.user?.id || 'api_key'
                  }
                });
                break;

              case 'event':
                result = await prisma.event.create({
                  data: {
                    organizationId: req.organizationId!,
                    identityId: operation.data.identityId,
                    type: operation.data.type,
                    name: operation.data.name,
                    properties: operation.data.properties,
                    timestamp: operation.data.timestamp ? new Date(operation.data.timestamp) : new Date(),
                    version: operation.data.version || 1,
                    idempotencyKey: operation.data.idempotencyKey,
                    createdBy: req.user?.id || 'api_key'
                  }
                });
                break;

              default:
                throw new Error(`Unknown operation type: ${operation.type}`);
            }

            results.push({ id: operation.id, type: operation.type, status: 'success', data: result });
          } catch (error) {
            errors.push({ 
              id: operation.id, 
              type: operation.type, 
              status: 'error', 
              error: error instanceof Error ? error.message : String(error) 
            });
          }
        }

        // Log batch processing metrics
        AuditService.logPerformanceMetric(
          'batch_canonical_operations',
          operations.length,
          'count',
          'CANONICAL_SPEC',
          {
            organizationId: req.organizationId,
            successCount: results.length.toString(),
            errorCount: errors.length.toString()
          }
        );

        res.json({
          success: true,
          message: 'Batch operations completed',
          results: {
            total: operations.length,
            successful: results.length,
            failed: errors.length,
            operations: results,
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

  // Get Identity Traits
  app.get(`${prefix}/identities/:id/traits`,
    [validateAPIKey, withOrganization],
    requirePermission(['TRAITS_READ']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { key, type } = req.query;

        const where: any = {
          identityId: id,
          organizationId: req.organizationId
        };

        if (key) where.key = key as string;
        if (type) where.type = type as string;

        const traits = await withQueryLogging(
          'get_identity_traits',
          { identityId: id, key, type },
          async () => {
            return await prisma.trait.findMany({
              where,
              orderBy: { createdAt: 'desc' }
            });
          },
          { operation: 'trait_retrieval' }
        );

        res.json({
          success: true,
          data: traits,
          count: traits.length
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

  // Get Identity Events
  app.get(`${prefix}/identities/:id/events`,
    [validateAPIKey, withOrganization],
    requirePermission(['INGEST_READ']),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { type, name, startDate, endDate, limit = 100 } = req.query;

        const where: any = {
          identityId: id,
          organizationId: req.organizationId
        };

        if (type) where.type = type as string;
        if (name) where.name = name as string;
        if (startDate || endDate) {
          where.timestamp = {};
          if (startDate) where.timestamp.gte = new Date(startDate as string);
          if (endDate) where.timestamp.lte = new Date(endDate as string);
        }

        const events = await withQueryLogging(
          'get_identity_events',
          { identityId: id, type, name, startDate, endDate, limit },
          async () => {
            return await prisma.event.findMany({
              where,
              orderBy: { timestamp: 'desc' },
              take: parseInt(limit as string)
            });
          },
          { operation: 'event_retrieval' }
        );

        res.json({
          success: true,
          data: events,
          count: events.length
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

export default setupCanonicalRoutes; 