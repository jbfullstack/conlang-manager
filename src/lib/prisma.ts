// import { PrismaClient } from '@prisma/client';

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };

// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
//   });

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const g = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaReady?: Promise<void>;
};

export const prisma = g.prisma ?? new PrismaClient();
export const prismaReady = g.prismaReady ?? prisma.$connect();

if (process.env.NODE_ENV !== 'production') {
  g.prisma = prisma;
  g.prismaReady = prismaReady;
}
