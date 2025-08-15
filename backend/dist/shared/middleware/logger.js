"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPerformanceMetric = exports.logAuditEvent = exports.logDatabaseQuery = exports.logResponse = exports.logRequest = exports.requestLogger = exports.dbLogger = exports.performanceLogger = exports.auditLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
const customFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }), winston_1.default.format.printf(({ timestamp, level, message, metadata, stack }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        log += ` | Metadata: ${JSON.stringify(metadata)}`;
    }
    if (stack) {
        log += `\nStack: ${stack}`;
    }
    return log;
}));
const consoleTransport = new winston_1.default.transports.Console({
    format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
});
const errorFileTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    format: customFormat
});
const combinedFileTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: customFormat
});
const auditFileTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logsDir, 'audit-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    maxSize: '20m',
    maxFiles: '30d',
    format: customFormat
});
const performanceFileTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logsDir, 'performance-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    maxSize: '20m',
    maxFiles: '14d',
    format: customFormat
});
exports.logger = winston_1.default.createLogger({
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
exports.auditLogger = winston_1.default.createLogger({
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
exports.performanceLogger = winston_1.default.createLogger({
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
exports.dbLogger = winston_1.default.createLogger({
    level: 'info',
    defaultMeta: {
        service: 'precision-ads-db',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        consoleTransport,
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'database-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            format: customFormat
        })
    ]
});
exports.requestLogger = winston_1.default.createLogger({
    level: 'info',
    defaultMeta: {
        service: 'precision-ads-requests',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        consoleTransport,
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'requests-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '7d',
            format: customFormat
        })
    ]
});
const logRequest = (req, metadata = {}) => {
    exports.requestLogger.info('Incoming request', {
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
exports.logRequest = logRequest;
const logResponse = (req, res, responseTime, metadata = {}) => {
    exports.requestLogger.info('Outgoing response', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: res.get('Content-Length'),
        ...metadata
    });
};
exports.logResponse = logResponse;
const logDatabaseQuery = (query, params, duration, metadata = {}) => {
    exports.dbLogger.info('Database query executed', {
        query,
        params,
        duration: `${duration}ms`,
        ...metadata
    });
};
exports.logDatabaseQuery = logDatabaseQuery;
const logAuditEvent = (event, userId, action, details = {}) => {
    exports.auditLogger.info('Audit event', {
        event,
        userId,
        action,
        timestamp: new Date().toISOString(),
        ...details
    });
};
exports.logAuditEvent = logAuditEvent;
const logPerformanceMetric = (metric, value, unit, metadata = {}) => {
    exports.performanceLogger.info('Performance metric', {
        metric,
        value,
        unit,
        timestamp: new Date().toISOString(),
        ...metadata
    });
};
exports.logPerformanceMetric = logPerformanceMetric;
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map