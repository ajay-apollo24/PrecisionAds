import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  winston.format.printf(({ timestamp, level, message, metadata, stack }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(metadata).length > 0) {
      log += ` | Metadata: ${JSON.stringify(metadata)}`;
    }
    
    if (stack) {
      log += `\nStack: ${stack}`;
    }
    
    return log;
  })
);

// Console transport with enhanced format
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, metadata, stack, module, endpoint, errorType }) => {
      let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      
      // Add module and endpoint context if available
      if (module && module !== 'unknown') {
        log += ` | Module: ${module}`;
      }
      if (endpoint && endpoint !== 'unknown') {
        log += ` | Endpoint: ${endpoint}`;
      }
      if (errorType) {
        log += ` | Type: ${errorType}`;
      }
      
      if (metadata && typeof metadata === 'object' && Object.keys(metadata as object).length > 0) {
        log += ` | Metadata: ${JSON.stringify(metadata)}`;
      }
      
      if (stack) {
        log += `\nStack: ${stack}`;
      }
      
      return log;
    })
  )
});

// File transports with rotation
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d',
  format: customFormat
});

const combinedFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: customFormat
});

const auditFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '20m',
  maxFiles: '30d',
  format: customFormat
});

const performanceFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'performance-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '20m',
  maxFiles: '14d',
  format: customFormat
});

// Main logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { 
    service: 'precision-ads',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport
  ]
});

// Audit logger for business events
export const auditLogger = winston.createLogger({
  level: 'info',
  defaultMeta: { 
    service: 'precision-ads-audit',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    consoleTransport,
    auditFileTransport
  ]
});

// Performance logger for metrics
export const performanceLogger = winston.createLogger({
  level: 'info',
  defaultMeta: { 
    service: 'precision-ads-performance',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    consoleTransport,
    performanceFileTransport
  ]
});

// Database query logger
export const dbLogger = winston.createLogger({
  level: 'info',
  defaultMeta: { 
    service: 'precision-ads-db',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    consoleTransport,
    new DailyRotateFile({
      filename: path.join(logsDir, 'database-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: customFormat
    })
  ]
});

// Request/Response logger
export const requestLogger = winston.createLogger({
  level: 'info',
  defaultMeta: { 
    service: 'precision-ads-requests',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    consoleTransport,
    new DailyRotateFile({
      filename: path.join(logsDir, 'requests-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      format: customFormat
    })
  ]
});

// Utility functions for structured logging
export const logRequest = (req: any, metadata: any = {}) => {
  requestLogger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    headers: req.headers,
    body: req.body,
    params: req.params,
    query: req.query,
    ...metadata
  });
};

export const logResponse = (req: any, res: any, responseTime: number, metadata: any = {}) => {
  requestLogger.info('Outgoing response', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    contentLength: res.get('Content-Length'),
    ...metadata
  });
};

export const logDatabaseQuery = (query: string, params: any, duration: number, metadata: any = {}) => {
  dbLogger.info('Database query executed', {
    query,
    params,
    duration: `${duration}ms`,
    ...metadata
  });
};

export const logAuditEvent = (event: string, userId: string, action: string, details: any = {}) => {
  auditLogger.info('Audit event', {
    event,
    userId,
    action,
    timestamp: new Date().toISOString(),
    ...details
  });
};

export const logPerformanceMetric = (metric: string, value: number, unit: string, metadata: any = {}) => {
  performanceLogger.info('Performance metric', {
    metric,
    value,
    unit,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

export default logger; 