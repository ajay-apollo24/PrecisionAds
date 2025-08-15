import { PrismaClient } from '@prisma/client';
import { createDbLogger } from '../middleware/db-logger';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Add enhanced logging to Prisma client
export const loggedPrisma = createDbLogger(prisma);

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = loggedPrisma;
}

export default loggedPrisma; 