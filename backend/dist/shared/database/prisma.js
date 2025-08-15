"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggedPrisma = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const db_logger_1 = require("../middleware/db-logger");
exports.prisma = globalThis.prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
exports.loggedPrisma = (0, db_logger_1.createDbLogger)(exports.prisma);
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = exports.loggedPrisma;
}
exports.default = exports.loggedPrisma;
//# sourceMappingURL=prisma.js.map