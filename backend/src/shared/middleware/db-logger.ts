import { PrismaClient } from '@prisma/client';
import { logDatabaseQuery } from './logger';

// Simple wrapper for logging database operations
export const createDbLogger = (prisma: PrismaClient) => {
  // Add logging methods to the prisma instance
  (prisma as any).logQuery = (operation: string, params: any, duration: number, metadata: any = {}) => {
    logDatabaseQuery(operation, params, duration, metadata);
  };

  return prisma;
};

// Manual query logging function for complex queries
export const logQuery = (operation: string, params: any, duration: number, metadata: any = {}) => {
  logDatabaseQuery(operation, params, duration, metadata);
};

// Performance monitoring wrapper
export const withQueryLogging = async <T>(
  operation: string,
  params: any,
  queryFn: () => Promise<T>,
  metadata: any = {}
): Promise<T> => {
  const startTime = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    logQuery(operation, params, duration, {
      ...metadata,
      success: true,
      resultType: Array.isArray(result) ? 'array' : typeof result,
      resultCount: Array.isArray(result) ? result.length : 1
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logQuery(operation, params, duration, {
      ...metadata,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
    
    throw error;
  }
};

export default createDbLogger; 