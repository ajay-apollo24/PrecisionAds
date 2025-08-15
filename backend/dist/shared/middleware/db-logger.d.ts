import { PrismaClient } from '@prisma/client';
export declare const createDbLogger: (prisma: PrismaClient) => PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const logQuery: (operation: string, params: any, duration: number, metadata?: any) => void;
export declare const withQueryLogging: <T>(operation: string, params: any, queryFn: () => Promise<T>, metadata?: any) => Promise<T>;
export default createDbLogger;
//# sourceMappingURL=db-logger.d.ts.map