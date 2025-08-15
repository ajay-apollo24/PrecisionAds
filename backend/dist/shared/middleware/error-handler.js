"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.createError = exports.errorHandler = void 0;
const logger_1 = require("./logger");
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    logger_1.logger.error({
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    const errorResponse = {
        error: {
            message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        },
        timestamp: new Date().toISOString(),
        path: req.url
    };
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
const notFound = (req, res, next) => {
    const error = (0, exports.createError)(`Route ${req.originalUrl} not found`, 404);
    next(error);
};
exports.notFound = notFound;
//# sourceMappingURL=error-handler.js.map