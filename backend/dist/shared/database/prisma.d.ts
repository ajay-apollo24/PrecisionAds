import { PrismaClient } from '@prisma/client';
declare global {
    var prisma: PrismaClient | undefined;
}
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const loggedPrisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export default loggedPrisma;
//# sourceMappingURL=prisma.d.ts.map