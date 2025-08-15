import winston from 'winston';
export declare const logger: winston.Logger;
export declare const auditLogger: winston.Logger;
export declare const performanceLogger: winston.Logger;
export declare const dbLogger: winston.Logger;
export declare const requestLogger: winston.Logger;
export declare const logRequest: (req: any, metadata?: any) => void;
export declare const logResponse: (req: any, res: any, responseTime: number, metadata?: any) => void;
export declare const logDatabaseQuery: (query: string, params: any, duration: number, metadata?: any) => void;
export declare const logAuditEvent: (event: string, userId: string, action: string, details?: any) => void;
export declare const logPerformanceMetric: (metric: string, value: number, unit: string, metadata?: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map