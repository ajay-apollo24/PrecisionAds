"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const logger_1 = require("../middleware/logger");
class AuditService {
    static logEvent(event) {
        const auditEvent = {
            ...event,
            timestamp: new Date()
        };
        (0, logger_1.logAuditEvent)(auditEvent.event, auditEvent.userId, auditEvent.action, {
            resourceType: auditEvent.resourceType,
            resourceId: auditEvent.resourceId,
            details: auditEvent.details,
            ipAddress: auditEvent.ipAddress,
            userAgent: auditEvent.userAgent
        });
    }
    static logAuthEvent(userId, action, details = {}) {
        this.logEvent({
            event: 'AUTHENTICATION',
            userId,
            action,
            resourceType: 'USER',
            resourceId: userId,
            details,
            ipAddress: details.ipAddress,
            userAgent: details.userAgent
        });
    }
    static logCRUDEvent(userId, action, resourceType, resourceId, details = {}) {
        this.logEvent({
            event: 'CRUD_OPERATION',
            userId,
            action,
            resourceType,
            resourceId,
            details
        });
    }
    static logAdServingEvent(userId, action, resourceType, resourceId, details = {}) {
        this.logEvent({
            event: 'AD_SERVING',
            userId,
            action,
            resourceType,
            resourceId,
            details
        });
    }
    static logFinancialEvent(userId, action, resourceType, resourceId, amount, currency = 'USD', details = {}) {
        this.logEvent({
            event: 'FINANCIAL',
            userId,
            action,
            resourceType,
            resourceId,
            details: {
                amount,
                currency,
                ...details
            }
        });
    }
    static logPerformanceMetric(metric, value, unit, category, tags = {}) {
        const performanceMetric = {
            metric,
            value,
            unit,
            category,
            tags,
            timestamp: new Date()
        };
        (0, logger_1.logPerformanceMetric)(performanceMetric.metric, performanceMetric.value, performanceMetric.unit, {
            category: performanceMetric.category,
            tags: performanceMetric.tags
        });
    }
    static logAPIMetric(endpoint, method, responseTime, statusCode, userId) {
        this.logPerformanceMetric('api_response_time', responseTime, 'ms', 'API', {
            endpoint,
            method,
            statusCode: statusCode.toString(),
            userId: userId || 'anonymous'
        });
    }
    static logDatabaseMetric(operation, table, duration, recordCount) {
        this.logPerformanceMetric('database_operation', duration, 'ms', 'DATABASE', {
            operation,
            table,
            recordCount: recordCount.toString()
        });
    }
}
exports.AuditService = AuditService;
exports.default = AuditService;
//# sourceMappingURL=audit.service.js.map