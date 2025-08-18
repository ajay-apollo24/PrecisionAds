import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface LogData {
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent: string;
  ip: string;
  organizationId?: string;
  userId?: string;
  requestBody?: any;
  responseBody?: any;
  error?: any;
  headers?: any;
  query?: any;
  params?: any;
}

class EnhancedLogger {
  private logLevel: 'debug' | 'info' | 'warn' | 'error';

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as any) || 'info';
  }

  private shouldLog(level: string): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level as keyof typeof levels] >= levels[this.logLevel];
  }

  private formatLog(data: LogData): string {
    const emoji = this.getStatusEmoji(data.statusCode);
    const method = data.method.padEnd(7);
    const status = data.statusCode.toString().padStart(3);
    const time = data.responseTime.toFixed(2).padStart(6);
    
    let log = `${emoji} ${method} ${status} ${time}ms | ${data.url}`;
    
    if (data.organizationId) {
      log += ` | Org: ${data.organizationId}`;
    }
    
    if (data.userId) {
      log += ` | User: ${data.userId}`;
    }
    
    if (data.ip) {
      log += ` | IP: ${data.ip}`;
    }

    return log;
  }

  private getStatusEmoji(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '✅';
    if (statusCode >= 300 && statusCode < 400) return '🔄';
    if (statusCode >= 400 && statusCode < 500) return '⚠️';
    if (statusCode >= 500) return '💥';
    return '❓';
  }

  private getClientIP(req: Request): string {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           (req.connection as any).socket?.remoteAddress || 
           'unknown';
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveFields = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = sanitized[field].substring(0, 20) + '...';
      }
    });
    
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }

  private logRequest(req: Request, startTime: number): void {
    if (!this.shouldLog('debug')) return;

    const logData: Partial<LogData> = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.get('User-Agent') || 'unknown',
      ip: this.getClientIP(req),
      organizationId: req.headers['x-organization-id'] as string,
      userId: (req as any).user?.id,
      headers: this.sanitizeHeaders(req.headers),
      query: req.query,
      params: req.params,
      requestBody: this.sanitizeBody(req.body)
    };

    console.log('🚀 REQUEST:', JSON.stringify(logData, null, 2));
  }

  private logResponse(req: Request, res: Response, startTime: number, responseBody?: any): void {
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    const logData: LogData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent') || 'unknown',
      ip: this.getClientIP(req),
      organizationId: req.headers['x-organization-id'] as string,
      userId: (req as any).user?.id,
      responseBody: this.sanitizeBody(responseBody)
    };

    // Log the formatted response
    console.log(this.formatLog(logData));

    // Log detailed response for debugging
    if (this.shouldLog('debug')) {
      console.log('📤 RESPONSE:', JSON.stringify(logData, null, 2));
    }

    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`🐌 SLOW REQUEST: ${req.method} ${req.url} took ${responseTime.toFixed(2)}ms`);
    }

    // Log errors with full context
    if (res.statusCode >= 400) {
      this.logError(req, res, responseTime, responseBody);
    }
  }

  private logError(req: Request, res: Response, responseTime: number, responseBody?: any): void {
    const errorData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent') || 'unknown',
      ip: this.getClientIP(req),
      organizationId: req.headers['x-organization-id'] as string,
      userId: (req as any).user?.id,
      headers: this.sanitizeHeaders(req.headers),
      query: req.query,
      params: req.params,
      requestBody: this.sanitizeBody(req.body),
      responseBody: this.sanitizeBody(responseBody),
      stack: new Error().stack
    };

    console.error('💥 ERROR DETAILS:', JSON.stringify(errorData, null, 2));
  }

  private logRouteNotFound(req: Request): void {
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.get('User-Agent') || 'unknown',
      ip: this.getClientIP(req),
      headers: this.sanitizeHeaders(req.headers),
      query: req.query,
      params: req.params,
      availableRoutes: this.getAvailableRoutes()
    };

    console.error('🚫 ROUTE NOT FOUND:', JSON.stringify(logData, null, 2));
  }

  private getAvailableRoutes(): string[] {
    // This would be populated with actual routes from your app
    return [
      '/api/v1/admin/*',
      '/api/v1/auth/*', 
      '/api/v1/publisher/*',
      '/api/v1/advertiser/*',
      '/api/v1/ad-serving/*',
      '/api/v1/audience-management/*',
      '/api/v1/analytics-reporting/*',
      '/api/v1/advanced-ad-algorithms/*'
    ];
  }

  // Main middleware function
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();
      
      // Log incoming request
      this.logRequest(req, startTime);

      // Capture response body for logging
      const originalSend = res.send;
      let responseBody: any;

      res.send = function(body: any) {
        responseBody = body;
        return originalSend.call(this, body);
      };

      // Log response when request finishes
      res.on('finish', () => {
        this.logResponse(req, res, startTime, responseBody);
      });

      // Log errors
      res.on('error', (error) => {
        console.error('💥 RESPONSE ERROR:', error);
      });

      next();
    };
  }

  // 404 handler middleware
  handle404() {
    return (req: Request, res: Response, next: NextFunction) => {
      this.logRouteNotFound(req);
      next();
    };
  }

  // Log unhandled errors
  logUnhandledError(error: Error, req: Request): void {
    const errorData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.get('User-Agent') || 'unknown',
      ip: this.getClientIP(req),
      organizationId: req.headers['x-organization-id'] as string,
      userId: (req as any).user?.id,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      headers: this.sanitizeHeaders(req.headers),
      query: req.query,
      params: req.params,
      requestBody: this.sanitizeBody(req.body)
    };

    console.error('💥 UNHANDLED ERROR:', JSON.stringify(errorData, null, 2));
  }

  // Performance monitoring
  logPerformanceMetrics(req: Request, responseTime: number): void {
    if (responseTime > 5000) {
      console.error(`🐌 CRITICAL SLOW REQUEST: ${req.method} ${req.url} took ${responseTime.toFixed(2)}ms`);
    } else if (responseTime > 2000) {
      console.warn(`🐌 VERY SLOW REQUEST: ${req.method} ${req.url} took ${responseTime.toFixed(2)}ms`);
    } else if (responseTime > 1000) {
      console.warn(`🐌 SLOW REQUEST: ${req.method} ${req.url} took ${responseTime.toFixed(2)}ms`);
    }
  }

  // Database query logging
  logDatabaseQuery(query: string, params: any[], duration: number): void {
    if (duration > 100) {
      console.warn(`🐌 SLOW DB QUERY (${duration.toFixed(2)}ms): ${query}`);
      if (this.shouldLog('debug')) {
        console.log('📊 Query Params:', params);
      }
    }
  }

  // Memory usage logging
  logMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    if (memUsageMB.heapUsed > 500) {
      console.warn(`⚠️ HIGH MEMORY USAGE: ${memUsageMB.heapUsed}MB`);
    }

    if (this.shouldLog('debug')) {
      console.log('💾 Memory Usage:', memUsageMB);
    }
  }
}

export const enhancedLogger = new EnhancedLogger();
export const enhancedLoggerMiddleware = enhancedLogger.middleware();
export const enhancedLogger404Handler = enhancedLogger.handle404(); 