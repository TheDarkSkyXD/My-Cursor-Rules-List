import 'dotenv/config';
// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/monitoring/logger';

const prisma = new PrismaClient();

async function main() {
  try {
    logger.info('Starting database cleanup...');

    // Delete in order respecting foreign key constraints
    logger.info('Deleting weight goal milestones...');
    await prisma.weight_goal_milestones.deleteMany();

    logger.info('Deleting weight goals...');
    await prisma.weight_goals.deleteMany();

    logger.info('Deleting cat weight logs...');
    await prisma.cat_weight_logs.deleteMany();

    logger.info('Deleting feeding logs...');
    await prisma.feeding_logs.deleteMany();

    logger.info('Deleting schedules...');
    await prisma.schedules.deleteMany();

    logger.info('Deleting cats...');
    await prisma.cats.deleteMany();

    logger.info('Deleting household members...');
    await prisma.household_members.deleteMany();

    logger.info('Deleting households...');
    await prisma.households.deleteMany();

    logger.info('Deleting notifications...');
    await prisma.notifications.deleteMany();

    logger.info('Deleting profiles...');
    await prisma.profiles.deleteMany();

    logger.info('Database cleanup completed successfully.');
  } catch (error) {
    logger.error('Error during database cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    logger.error('Fatal error during database cleanup:', e);
    process.exit(1);
  }); 