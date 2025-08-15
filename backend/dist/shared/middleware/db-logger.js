"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withQueryLogging = exports.logQuery = exports.createDbLogger = void 0;
const logger_1 = require("./logger");
const createDbLogger = (prisma) => {
    prisma.logQuery = (operation, params, duration, metadata = {}) => {
        (0, logger_1.logDatabaseQuery)(operation, params, duration, metadata);
    };
    return prisma;
};
exports.createDbLogger = createDbLogger;
const logQuery = (operation, params, duration, metadata = {}) => {
    (0, logger_1.logDatabaseQuery)(operation, params, duration, metadata);
};
exports.logQuery = logQuery;
const withQueryLogging = async (operation, params, queryFn, metadata = {}) => {
    const startTime = Date.now();
    try {
        const result = await queryFn();
        const duration = Date.now() - startTime;
        (0, exports.logQuery)(operation, params, duration, {
            ...metadata,
            success: true,
            resultType: Array.isArray(result) ? 'array' : typeof result,
            resultCount: Array.isArray(result) ? result.length : 1
        });
        return result;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        (0, exports.logQuery)(operation, params, duration, {
            ...metadata,
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
};
exports.withQueryLogging = withQueryLogging;
exports.default = exports.createDbLogger;
//# sourceMappingURL=db-logger.js.map