import { Express, Response } from 'express';
import { createError } from '../../../shared/middleware/error-handler';
import { 
  withOrganization, 
  requirePermission,
  validateAPIKey 
} from '../../../shared/middleware/rbac.middleware';
import { prisma } from '../../../shared/database/prisma';
import { RBACRequest } from '../../../shared/middleware/rbac.middleware';

export function setupCanonicalRoutes(app: Express, prefix: string): void {
  // Identity Management
  app.post(`${prefix}/identities`,
    [validateAPIKey, withOrganization],
    requirePermission(['INGEST_WRITE']),
    async (req: RBACRequest, res: Response) => {
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
          const existing = await (prisma as any).identity.findFirst({
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

        const identity = await (prisma as any).identity.create({
          data: {
            organizationId: req.organizationId,
            externalId,
            anonymousId,
            userId,
            identityTraits: traits, // Use identityTraits instead of traits
            version,
            idempotencyKey
          }
        });

        return res.status(201).json({
          success: true,
          message: 'Identity created successfully',
          data: identity
        });
      } catch (error: any) {
        console.error('Error creating identity:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // Get Identity
  app.get(`${prefix}/identities/:id`,
    [validateAPIKey, withOrganization],
    requirePermission(['INGEST_READ']),
    async (req: RBACRequest, res: Response) => {
      try {
        const { id } = req.params;
        
        if (!req.organizationId) {
          throw createError('Organization context required', 400);
        }

        const identity = await (prisma as any).identity.findFirst({
          where: {
            id,
            organizationId: req.organizationId
          }
        });

        if (!identity) {
          return res.status(404).json({ error: 'Identity not found' });
        }

        return res.json({
          success: true,
          data: identity
        });
      } catch (error: any) {
        console.error('Error getting identity:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // Create Trait
  app.post(`${prefix}/traits`,
    [validateAPIKey, withOrganization],
    requirePermission(['TRAITS_WRITE']),
    async (req: RBACRequest, res: Response) => {
      try {
        const {
          identityId,
          key,
          value,
          type,
          version = 1,
          idempotencyKey
        } = req.body;

        if (!req.organizationId || !identityId || !key || value === undefined) {
          throw createError('Missing required fields', 400);
        }

        const trait = await (prisma as any).trait.create({
          data: {
            organizationId: req.organizationId,
            identityId,
            key,
            value,
            type,
            version,
            idempotencyKey,
            createdBy: req.user?.id || 'system'
          }
        });

        return res.status(201).json({
          success: true,
          message: 'Trait created successfully',
          data: trait
        });
      } catch (error: any) {
        console.error('Error creating trait:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // Get Traits for Identity
  app.get(`${prefix}/identities/:id/traits`,
    [validateAPIKey, withOrganization],
    requirePermission(['TRAITS_READ']),
    async (req: RBACRequest, res: Response) => {
      try {
        const { id } = req.params;
        
        if (!req.organizationId) {
          throw createError('Organization context required', 400);
        }

        const traits = await (prisma as any).trait.findMany({
          where: {
            identityId: id,
            organizationId: req.organizationId
          }
        });

        return res.json({
          success: true,
          data: traits
        });
      } catch (error: any) {
        console.error('Error getting traits:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // Create Cohort
  app.post(`${prefix}/cohorts`,
    [validateAPIKey, withOrganization],
    requirePermission(['COHORTS_WRITE']),
    async (req: RBACRequest, res: Response) => {
      try {
        const {
          name,
          description,
          type,
          criteria,
          members,
          version = 1,
          idempotencyKey
        } = req.body;

        if (!req.organizationId || !name || !criteria) {
          throw createError('Missing required fields', 400);
        }

        const cohort = await (prisma as any).cohort.create({
          data: {
            organizationId: req.organizationId,
            name,
            description,
            type,
            criteria,
            members,
            version,
            idempotencyKey,
            createdBy: req.user?.id || 'system'
          }
        });

        return res.status(201).json({
          success: true,
          message: 'Cohort created successfully',
          data: cohort
        });
      } catch (error: any) {
        console.error('Error creating cohort:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // Get Cohort
  app.get(`${prefix}/cohorts/:id`,
    [validateAPIKey, withOrganization],
    requirePermission(['COHORTS_READ']),
    async (req: RBACRequest, res: Response) => {
      try {
        const { id } = req.params;
        
        if (!req.organizationId) {
          throw createError('Organization context required', 400);
        }

        const cohort = await (prisma as any).cohort.findFirst({
          where: {
            id,
            organizationId: req.organizationId
          }
        });

        if (!cohort) {
          return res.status(404).json({ error: 'Cohort not found' });
        }

        return res.json({
          success: true,
          data: cohort
        });
      } catch (error: any) {
        console.error('Error getting cohort:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // Track Event
  app.post(`${prefix}/events`,
    [validateAPIKey, withOrganization],
    requirePermission(['INGEST_WRITE']),
    async (req: RBACRequest, res: Response) => {
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
          throw createError('Missing required fields', 400);
        }

        const event = await (prisma as any).event.create({
          data: {
            organizationId: req.organizationId,
            identityId,
            type,
            name,
            properties,
            timestamp: timestamp || new Date(),
            version,
            idempotencyKey,
            createdBy: req.user?.id || 'system'
          }
        });

        return res.status(201).json({
          success: true,
          message: 'Event tracked successfully',
          data: event
        });
      } catch (error: any) {
        console.error('Error tracking event:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // Get Events for Identity
  app.get(`${prefix}/identities/:id/events`,
    [validateAPIKey, withOrganization],
    requirePermission(['INGEST_READ']),
    async (req: RBACRequest, res: Response) => {
      try {
        const { id } = req.params;
        
        if (!req.organizationId) {
          throw createError('Organization context required', 400);
        }

        const events = await (prisma as any).event.findMany({
          where: {
            identityId: id,
            organizationId: req.organizationId
          },
          orderBy: {
            timestamp: 'desc'
          }
        });

        return res.json({
          success: true,
          data: events
        });
      } catch (error: any) {
        console.error('Error getting events:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // Batch Operations
  app.post(`${prefix}/batch`,
    [validateAPIKey, withOrganization],
    requirePermission(['INGEST_WRITE']),
    async (req: RBACRequest, res: Response) => {
      try {
        const { operations } = req.body;

        if (!req.organizationId || !Array.isArray(operations)) {
          throw createError('Invalid batch operations', 400);
        }

        const results = [];
        const errors = [];

        for (const operation of operations) {
          try {
            let result;
            
            switch (operation.type) {
              case 'identity':
                // Extract traits from operation.data and map to identityTraits
                const { traits, ...identityData } = operation.data;
                result = await (prisma as any).identity.create({
                  data: {
                    ...identityData,
                    identityTraits: traits, // Use identityTraits instead of traits
                    organizationId: req.organizationId
                  }
                });
                break;
                
              case 'trait':
                result = await (prisma as any).trait.create({
                  data: {
                    ...operation.data,
                    organizationId: req.organizationId,
                    createdBy: req.user?.id || 'system'
                  }
                });
                break;
                
              case 'cohort':
                result = await (prisma as any).cohort.create({
                  data: {
                    ...operation.data,
                    organizationId: req.organizationId,
                    createdBy: req.user?.id || 'system'
                  }
                });
                break;
                
              case 'event':
                result = await (prisma as any).event.create({
                  data: {
                    ...operation.data,
                    organizationId: req.organizationId,
                    createdBy: req.user?.id || 'system'
                  }
                });
                break;
                
              default:
                throw new Error(`Unknown operation type: ${operation.type}`);
            }
            
            results.push({ id: operation.id, success: true, data: result });
          } catch (error: any) {
            errors.push({ id: operation.id, success: false, error: error.message });
          }
        }

        return res.json({
          success: true,
          results: {
            total: operations.length,
            successful: results.length,
            failed: errors.length,
            results: [...results, ...errors]
          }
        });
      } catch (error: any) {
        console.error('Error in batch operations:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );
} 