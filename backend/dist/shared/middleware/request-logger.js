"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoggerMiddleware = void 0;
const logger_1 = require("./logger");
const requestLoggerMiddleware = (req, res, next) => {
    req.startTime = Date.now();
    (0, logger_1.logRequest)(req, {
        requestId: req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
    });
    const originalEnd = res.end;
    res.end = function (chunk, encoding, cb) {
        const responseTime = Date.now() - (req.startTime || 0);
        (0, logger_1.logResponse)(req, res, responseTime, {
            requestId: req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
        });
        return originalEnd.call(this, chunk, encoding, cb);
    };
    next();
};
exports.requestLoggerMiddleware = requestLoggerMiddleware;
exports.default = exports.requestLoggerMiddleware;
//# sourceMappingURL=request-logger.js.map