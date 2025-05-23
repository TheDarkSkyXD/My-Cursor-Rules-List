// Filename: prisma-scripts/backfill-initial-weight-logs.ts
// Make sure to install Prisma Client if you haven't: npm install @prisma/client
// You might run this with ts-node: npx ts-node prisma-scripts/backfill-initial-weight-logs.ts

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function backfillInitialWeightLogs() {
  console.log('Starting backfill of initial weight logs for existing cats...');

  const catsToBackfill = await prisma.cats.findMany({
    where: {
      weight: {
        not: null, // Only consider cats that have a weight value
      },
      weight_logs: { // Corrected: Check if there are NO entries in cat_weight_logs for this cat
        none: {},
      },
    },
    select: {
      id: true,
      weight: true,
      created_at: true, // Used for the date of the initial weight log
      owner_id: true, // Potentially useful, though null is safer for 'measured_by' in backfill
    },
  });

  if (catsToBackfill.length === 0) {
    console.log('No cats found needing initial weight log backfill.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${catsToBackfill.length} cats to backfill with an initial weight log.`);

  let successCount = 0;
  let errorCount = 0;

  for (const cat of catsToBackfill) {
    // The 'weight' field in 'cats' table is Decimal?, so ensure it exists.
    // The query already filters for non-null weight, but an extra check is fine.
    if (cat.weight !== null) {
      try {
        // The 'date' field in 'cat_weight_logs' is a Date, not DateTime.
        // We convert the cat's 'created_at' (DateTime) to a Date object representing just YYYY-MM-DD.
        const logDate = new Date(cat.created_at.toISOString().split('T')[0]);

        await prisma.cat_weight_logs.create({
          data: {
            cat_id: cat.id,
            weight: cat.weight, // Prisma handles Decimal type
            date: logDate,
            measured_by: null, // Since this is a backfill, we don't know the original measurer
            notes: 'Initial weight (backfilled from legacy data)',
          },
        });
        console.log(`Successfully backfilled weight log for cat ID: ${cat.id}`);
        successCount++;
      } catch (error) {
        console.error(`Failed to backfill weight log for cat ID: ${cat.id}`, error);
        errorCount++;
      }
    }
  }

  console.log('-----------------------------------------');
  console.log('Backfill process completed.');
  console.log(`Successfully created logs for: ${successCount} cats.`);
  console.log(`Failed to create logs for: ${errorCount} cats.`);
  console.log('-----------------------------------------');

  await prisma.$disconnect();
}

backfillInitialWeightLogs()
  .catch((e) => {
    console.error('An error occurred during the backfill process:', e);
    prisma.$disconnect().finally(() => process.exit(1));
  }); 