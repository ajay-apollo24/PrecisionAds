"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCanonicalRoutes = setupCanonicalRoutes;
const error_handler_1 = require("../../../shared/middleware/error-handler");
const rbac_middleware_1 = require("../../../shared/middleware/rbac.middleware");
const prisma_1 = require("../../../shared/database/prisma");
const db_logger_1 = require("../../../shared/middleware/db-logger");
const audit_service_1 = __importDefault(require("../../../shared/services/audit.service"));
function setupCanonicalRoutes(app, prefix) {
    app.post(`${prefix}/identities`, [rbac_middleware_1.validateAPIKey, rbac_middleware_1.withOrganization], (0, rbac_middleware_1.requirePermission)(['INGEST_WRITE']), async (req, res) => {
        try {
            const { externalId, anonymousId, userId, traits, version = 1, idempotencyKey } = req.body;
            if (!req.organizationId) {
                throw (0, error_handler_1.createError)('Organization context required', 400);
            }
            if (idempotencyKey) {
                const existing = await prisma_1.prisma.identity.findFirst({
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
            const identity = await (0, db_logger_1.withQueryLogging)('create_identity', { externalId, anonymousId, userId, traits, version, idempotencyKey }, async () => {
                return await prisma_1.prisma.identity.create({
                    data: {
                        organizationId: req.organizationId,
                        externalId,
                        anonymousId,
                        userId,
                        traits,
                        version,
                        idempotencyKey
                    }
                });
            }, { operation: 'identity_creation' });
            audit_service_1.default.logCRUDEvent(req.user?.id || 'api_key', 'create', 'IDENTITY', identity.id, {
                externalId,
                anonymousId,
                userId,
                version,
                idempotencyKey
            });
            res.status(201).json({
                success: true,
                message: 'Identity created successfully',
                data: identity
            });
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
    app.get(`${prefix}/identities/:id`, [rbac_middleware_1.validateAPIKey, rbac_middleware_1.withOrganization], (0, rbac_middleware_1.requirePermission)(['INGEST_READ']), async (req, res) => {
        try {
            const { id } = req.params;
            const identity = await (0, db_logger_1.withQueryLogging)('get_identity', { id }, async () => {
                return await prisma_1.prisma.identity.findUnique({
                    where: { id },
                    include: {
                        traits: true,
                        events: {
                            take: 10,
                            orderBy: { timestamp: 'desc' }
                        }
                    }
                });
            }, { operation: 'identity_retrieval' });
            if (!identity) {
                throw (0, error_handler_1.createError)('Identity not found', 404);
            }
            res.json({
                success: true,
                data: identity
            });
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
    app.post(`${prefix}/traits`, [rbac_middleware_1.validateAPIKey, rbac_middleware_1.withOrganization], (0, rbac_middleware_1.requirePermission)(['TRAITS_WRITE']), async (req, res) => {
        try {
            const { identityId, key, value, type = 'STRING', version = 1, idempotencyKey } = req.body;
            if (!req.organizationId || !identityId || !key || value === undefined) {
                throw (0, error_handler_1.createError)('Organization context, identityId, key, and value are required', 400);
            }
            if (idempotencyKey) {
                const existing = await prisma_1.prisma.trait.findFirst({
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
            const trait = await (0, db_logger_1.withQueryLogging)('create_trait', { identityId, key, value, type, version, idempotencyKey }, async () => {
                return await prisma_1.prisma.trait.create({
                    data: {
                        organizationId: req.organizationId,
                        identityId,
                        key,
                        value,
                        type: type,
                        version,
                        idempotencyKey,
                        createdBy: req.user?.id || 'api_key'
                    }
                });
            }, { operation: 'trait_creation' });
            audit_service_1.default.logCRUDEvent(req.user?.id || 'api_key', 'create', 'TRAIT', trait.id, {
                identityId,
                key,
                type,
                version,
                idempotencyKey
            });
            res.status(201).json({
                success: true,
                message: 'Trait created successfully',
                data: trait
            });
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
    app.post(`${prefix}/cohorts`, [rbac_middleware_1.validateAPIKey, rbac_middleware_1.withOrganization], (0, rbac_middleware_1.requirePermission)(['COHORTS_WRITE']), async (req, res) => {
        try {
            const { name, description, type = 'STATIC', criteria, members, version = 1, idempotencyKey } = req.body;
            if (!req.organizationId || !name || !criteria) {
                throw (0, error_handler_1.createError)('Organization context, name, and criteria are required', 400);
            }
            if (idempotencyKey) {
                const existing = await prisma_1.prisma.cohort.findFirst({
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
            const cohort = await (0, db_logger_1.withQueryLogging)('create_cohort', { name, description, type, criteria, members, version, idempotencyKey }, async () => {
                return await prisma_1.prisma.cohort.create({
                    data: {
                        organizationId: req.organizationId,
                        name,
                        description,
                        type: type,
                        criteria,
                        members,
                        version,
                        idempotencyKey,
                        createdBy: req.user?.id || 'api_key'
                    }
                });
            }, { operation: 'cohort_creation' });
            audit_service_1.default.logCRUDEvent(req.user?.id || 'api_key', 'create', 'COHORT', cohort.id, {
                name,
                type,
                version,
                idempotencyKey
            });
            res.status(201).json({
                success: true,
                message: 'Cohort created successfully',
                data: cohort
            });
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
    app.post(`${prefix}/events`, [rbac_middleware_1.validateAPIKey, rbac_middleware_1.withOrganization], (0, rbac_middleware_1.requirePermission)(['INGEST_WRITE']), async (req, res) => {
        try {
            const { identityId, type, name, properties, timestamp, version = 1, idempotencyKey } = req.body;
            if (!req.organizationId || !identityId || !type || !name) {
                throw (0, error_handler_1.createError)('Organization context, identityId, type, and name are required', 400);
            }
            if (idempotencyKey) {
                const existing = await prisma_1.prisma.event.findFirst({
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
            const event = await (0, db_logger_1.withQueryLogging)('create_event', { identityId, type, name, properties, timestamp, version, idempotencyKey }, async () => {
                return await prisma_1.prisma.event.create({
                    data: {
                        organizationId: req.organizationId,
                        identityId,
                        type: type,
                        name,
                        properties,
                        timestamp: timestamp ? new Date(timestamp) : new Date(),
                        version,
                        idempotencyKey,
                        createdBy: req.user?.id || 'api_key'
                    }
                });
            }, { operation: 'event_creation' });
            audit_service_1.default.logCRUDEvent(req.user?.id || 'api_key', 'create', 'EVENT', event.id, {
                identityId,
                type,
                name,
                version,
                idempotencyKey
            });
            res.status(201).json({
                success: true,
                message: 'Event tracked successfully',
                data: event
            });
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
    app.post(`${prefix}/batch`, [rbac_middleware_1.validateAPIKey, rbac_middleware_1.withOrganization], (0, rbac_middleware_1.requirePermission)(['INGEST_WRITE']), async (req, res) => {
        try {
            const { operations } = req.body;
            if (!req.organizationId || !Array.isArray(operations)) {
                throw (0, error_handler_1.createError)('Organization context and operations array are required', 400);
            }
            const results = [];
            const errors = [];
            for (const operation of operations) {
                try {
                    let result;
                    switch (operation.type) {
                        case 'identity':
                            result = await prisma_1.prisma.identity.create({
                                data: {
                                    organizationId: req.organizationId,
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
                            result = await prisma_1.prisma.trait.create({
                                data: {
                                    organizationId: req.organizationId,
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
                            result = await prisma_1.prisma.event.create({
                                data: {
                                    organizationId: req.organizationId,
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
                }
                catch (error) {
                    errors.push({
                        id: operation.id,
                        type: operation.type,
                        status: 'error',
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }
            audit_service_1.default.logPerformanceMetric('batch_canonical_operations', operations.length, 'count', 'CANONICAL_SPEC', {
                organizationId: req.organizationId,
                successCount: results.length.toString(),
                errorCount: errors.length.toString()
            });
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
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
    app.get(`${prefix}/identities/:id/traits`, [rbac_middleware_1.validateAPIKey, rbac_middleware_1.withOrganization], (0, rbac_middleware_1.requirePermission)(['TRAITS_READ']), async (req, res) => {
        try {
            const { id } = req.params;
            const { key, type } = req.query;
            const where = {
                identityId: id,
                organizationId: req.organizationId
            };
            if (key)
                where.key = key;
            if (type)
                where.type = type;
            const traits = await (0, db_logger_1.withQueryLogging)('get_identity_traits', { identityId: id, key, type }, async () => {
                return await prisma_1.prisma.trait.findMany({
                    where,
                    orderBy: { createdAt: 'desc' }
                });
            }, { operation: 'trait_retrieval' });
            res.json({
                success: true,
                data: traits,
                count: traits.length
            });
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
    app.get(`${prefix}/identities/:id/events`, [rbac_middleware_1.validateAPIKey, rbac_middleware_1.withOrganization], (0, rbac_middleware_1.requirePermission)(['INGEST_READ']), async (req, res) => {
        try {
            const { id } = req.params;
            const { type, name, startDate, endDate, limit = 100 } = req.query;
            const where = {
                identityId: id,
                organizationId: req.organizationId
            };
            if (type)
                where.type = type;
            if (name)
                where.name = name;
            if (startDate || endDate) {
                where.timestamp = {};
                if (startDate)
                    where.timestamp.gte = new Date(startDate);
                if (endDate)
                    where.timestamp.lte = new Date(endDate);
            }
            const events = await (0, db_logger_1.withQueryLogging)('get_identity_events', { identityId: id, type, name, startDate, endDate, limit }, async () => {
                return await prisma_1.prisma.event.findMany({
                    where,
                    orderBy: { timestamp: 'desc' },
                    take: parseInt(limit)
                });
            }, { operation: 'event_retrieval' });
            res.json({
                success: true,
                data: events,
                count: events.length
            });
        }
        catch (error) {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });
}
exports.default = setupCanonicalRoutes;
//# sourceMappingURL=canonical.routes.js.map