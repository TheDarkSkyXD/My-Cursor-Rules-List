import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/monitoring/logger';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more: 
// https://pris.ly/d/help/next-js-best-practices

declare global {
  // Allow global `var` declarations
   
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  logger.info('[Prisma] Creating new PrismaClient instance.');
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
};

// Use the singleton pattern
const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
} else {
  logger.info('[Prisma] Using existing PrismaClient instance in production.');
}

// Removed custom connect/disconnect logic, Prisma handles this.

export default prisma;

// Optional: Add a simple check to see if the client seems okay after export
try {
    if (prisma && typeof prisma.$connect === 'function') {
        // logger.info('[Prisma] Prisma client instance appears valid after initialization.');
    } else {
       logger.error('[Prisma] Prisma client instance seems invalid after initialization.', { prismaType: typeof prisma });
    }
} catch (e) {
    logger.error('[Prisma] Error during post-initialization check.', { error: e });
}