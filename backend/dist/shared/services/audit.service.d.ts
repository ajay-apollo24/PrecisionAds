export interface AuditEvent {
    event: string;
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}
export interface PerformanceMetric {
    metric: string;
    value: number;
    unit: string;
    category: string;
    tags: Record<string, string>;
    timestamp: Date;
}
export declare class AuditService {
    static logEvent(event: Omit<AuditEvent, 'timestamp'>): void;
    static logAuthEvent(userId: string, action: 'login' | 'logout' | 'failed_login', details?: Record<string, any>): void;
    static logCRUDEvent(userId: string, action: 'create' | 'read' | 'update' | 'delete', resourceType: string, resourceId: string, details?: Record<string, any>): void;
    static logAdServingEvent(userId: string, action: string, resourceType: string, resourceId: string, details?: Record<string, any>): void;
    static logFinancialEvent(userId: string, action: string, resourceType: string, resourceId: string, amount: number, currency?: string, details?: Record<string, any>): void;
    static logPerformanceMetric(metric: string, value: number, unit: string, category: string, tags?: Record<string, string>): void;
    static logAPIMetric(endpoint: string, method: string, responseTime: number, statusCode: number, userId?: string): void;
    static logDatabaseMetric(operation: string, table: string, duration: number, recordCount: number): void;
}
export default AuditService;
//# sourceMappingURL=audit.service.d.ts.map