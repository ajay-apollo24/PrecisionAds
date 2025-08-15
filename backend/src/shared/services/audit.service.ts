import { logAuditEvent, logPerformanceMetric } from '../middleware/logger';

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

export class AuditService {
  /**
   * Log a business event
   */
  static logEvent(event: Omit<AuditEvent, 'timestamp'>): void {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date()
    };

    logAuditEvent(
      auditEvent.event,
      auditEvent.userId,
      auditEvent.action,
      {
        resourceType: auditEvent.resourceType,
        resourceId: auditEvent.resourceId,
        details: auditEvent.details,
        ipAddress: auditEvent.ipAddress,
        userAgent: auditEvent.userAgent
      }
    );
  }

  /**
   * Log user authentication events
   */
  static logAuthEvent(userId: string, action: 'login' | 'logout' | 'failed_login', details: Record<string, any> = {}): void {
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

  /**
   * Log CRUD operations
   */
  static logCRUDEvent(
    userId: string,
    action: 'create' | 'read' | 'update' | 'delete',
    resourceType: string,
    resourceId: string,
    details: Record<string, any> = {}
  ): void {
    this.logEvent({
      event: 'CRUD_OPERATION',
      userId,
      action,
      resourceType,
      resourceId,
      details
    });
  }

  /**
   * Log ad serving events
   */
  static logAdServingEvent(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, any> = {}
  ): void {
    this.logEvent({
      event: 'AD_SERVING',
      userId,
      action,
      resourceType,
      resourceId,
      details
    });
  }

  /**
   * Log financial events
   */
  static logFinancialEvent(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    amount: number,
    currency: string = 'USD',
    details: Record<string, any> = {}
  ): void {
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

  /**
   * Log performance metrics
   */
  static logPerformanceMetric(
    metric: string,
    value: number,
    unit: string,
    category: string,
    tags: Record<string, string> = {}
  ): void {
    const performanceMetric: PerformanceMetric = {
      metric,
      value,
      unit,
      category,
      tags,
      timestamp: new Date()
    };

    logPerformanceMetric(
      performanceMetric.metric,
      performanceMetric.value,
      performanceMetric.unit,
      {
        category: performanceMetric.category,
        tags: performanceMetric.tags
      }
    );
  }

  /**
   * Log API usage metrics
   */
  static logAPIMetric(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    userId?: string
  ): void {
    this.logPerformanceMetric(
      'api_response_time',
      responseTime,
      'ms',
      'API',
      {
        endpoint,
        method,
        statusCode: statusCode.toString(),
        userId: userId || 'anonymous'
      }
    );
  }

  /**
   * Log database performance metrics
   */
  static logDatabaseMetric(
    operation: string,
    table: string,
    duration: number,
    recordCount: number
  ): void {
    this.logPerformanceMetric(
      'database_operation',
      duration,
      'ms',
      'DATABASE',
      {
        operation,
        table,
        recordCount: recordCount.toString()
      }
    );
  }
}

export default AuditService; 