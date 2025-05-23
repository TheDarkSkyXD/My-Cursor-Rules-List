import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma'; // Adjusted path based on memory.md (lib/prisma.ts)
import { headers } from 'next/headers';
import { Prisma } from '@prisma/client';

// Zod schema for request body validation
const CreateWeightLogBodySchema = z.object({
  catId: z.string().uuid(),
  weight: z.number().positive(),
  date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, { message: "Date must be in YYYY-MM-DD format." }), // Expecting YYYY-MM-DD
  notes: z.string().optional(),
});

// Zod schema for request body validation for PUT requests
const UpdateWeightLogBodySchema = CreateWeightLogBodySchema.extend({
  // catId might be immutable or part of the log identified by ID in URL
  // For simplicity, we'll allow updating all fields except potentially catId if it refers to a different cat.
  // If catId can change, ensure user owns the new catId too.
  // For now, assume catId in body is the original catId and is not being changed to a different cat.
});

export type CreateWeightLogBody = z.infer<typeof CreateWeightLogBodySchema>;
export type UpdateWeightLogBody = z.infer<typeof UpdateWeightLogBodySchema>;
export type CreateWeightLogResponse = Awaited<ReturnType<typeof createWeightLogAndUpdateCat>>;

async function createWeightLogAndUpdateCat(data: CreateWeightLogBody, measuredById: string) {
  const { catId, weight, date, notes } = data;
  const logDate = new Date(date); // Convert date string to Date object for Prisma

  return prisma.$transaction(async (tx) => {
    // Step A: Create the new cat_weight_logs entry
    const newLog = await tx.cat_weight_logs.create({
      data: {
        cat_id: catId,
        weight: weight,
        date: logDate,
        notes: notes,
        measured_by: measuredById, // Authenticated user ID
      },
    });

    // Step B: Find the most recent weight log for this cat (including the new one)
    const latestLogForCat = await tx.cat_weight_logs.findFirst({
      where: { cat_id: catId },
      orderBy: { date: 'desc' },
    });

    // Step C: If the new log is the latest, update cats.weight
    if (latestLogForCat && latestLogForCat.id === newLog.id) {
      await tx.cats.update({
        where: { id: catId },
        data: { weight: newLog.weight }, // Update with the new log's weight
      });
    }
    
    // Return the newly created log entry (could also return the updated cat or a combined object)
    return newLog;
  });
}

// Helper function to find the latest log and update cat's weight
async function syncCatWeightWithLatestLog(tx: Prisma.TransactionClient, catId: string) {
  const latestLog = await tx.cat_weight_logs.findFirst({
    where: { cat_id: catId },
    orderBy: { date: 'desc' }, // Primary sort by date
    // If multiple logs on the same day, could add secondary sort by creation time if available
    // orderBy: [{ date: 'desc' }, { created_at: 'desc' }], 
  });

  await tx.cats.update({
    where: { id: catId },
    data: { weight: latestLog ? latestLog.weight : null }, // Set to null if no logs
  });
}

// POST handler for creating a new weight log
export async function POST(request: NextRequest) {
  try {
    // Authentication: Get user ID from header (as per memory.md)
    const headersList = headers();
    const authUserId = headersList.get('X-User-ID');

    if (!authUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse and validate request body
    const json = await request.json();
    const validatedBody = CreateWeightLogBodySchema.safeParse(json);

    if (!validatedBody.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validatedBody.error.format() }, { status: 400 });
    }

    // Call business logic function
    const result = await createWeightLogAndUpdateCat(validatedBody.data, authUserId);
    
    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('[API POST /api/weight-logs] Error:', error);
    // Distinguish Prisma errors or other specific errors if needed
    if (error instanceof z.ZodError) { // Should be caught by safeParse, but as a fallback
        return NextResponse.json({ error: 'Invalid request body', details: error.format() }, { status: 400 });
    }
    // Check if it's a Prisma known error, e.g., foreign key constraint fail if catId doesn't exist
    // if (error instanceof Prisma.PrismaClientKnownRequestError) { ... }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET handler for fetching weight logs for a cat
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const headersList = headers();
    const authUserId = headersList.get('X-User-ID');

    if (!authUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const catId = searchParams.get('catId');

    if (!catId || typeof catId !== 'string' || !z.string().uuid().safeParse(catId).success) {
      return NextResponse.json({ error: 'Valid catId query parameter is required' }, { status: 400 });
    }

    // Fetch weight logs for the cat, ordered by date descending
    const weightLogs = await prisma.cat_weight_logs.findMany({
      where: {
        cat_id: catId,
        // Optional: could also verify ownership if measured_by should be the authUserId,
        // or if cats table has a direct link to user profiles.
        // For now, just fetching by catId if user is authenticated.
      },
      orderBy: {
        date: 'desc',
      },
      // Optionally, include related data like 'measured_by' profile if needed for display
      // include: { measured_by_profile: { select: { username: true } } }
    });

    return NextResponse.json(weightLogs, { status: 200 });

  } catch (error) {
    console.error('[API GET /api/weight-logs] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT handler for updating an existing weight log
export async function PUT(request: NextRequest) {
  try {
    const headersList = headers();
    const authUserId = headersList.get('X-User-ID');

    if (!authUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const logId = searchParams.get('id');
    if (!logId || !z.string().uuid().safeParse(logId).success) {
      return NextResponse.json({ error: 'Valid log ID query parameter is required' }, { status: 400 });
    }

    const json = await request.json();
    const validatedBody = UpdateWeightLogBodySchema.safeParse(json);
    if (!validatedBody.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validatedBody.error.format() }, { status: 400 });
    }

    const { catId, weight, date, notes } = validatedBody.data;
    const logDate = new Date(date);

    // Authorization: Check if user owns the cat associated with the log being updated
    // This is a simplified check. A more robust check might involve ensuring the logId belongs to one of the user's cats.
    const catToUpdate = await prisma.cats.findUnique({
      where: { id: catId },
      select: { owner_id: true }
    });

    if (!catToUpdate || catToUpdate.owner_id !== authUserId) {
      return NextResponse.json({ error: 'Forbidden: You do not own the cat associated with this log.' }, { status: 403 });
    }
    
    // Also ensure the log being updated actually belongs to the specified catId in the body.
    // This prevents changing a log to belong to a different cat if not intended.
    const existingLog = await prisma.cat_weight_logs.findUnique({
      where: { id: logId },
      select: { cat_id: true }
    });

    if (!existingLog) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }
    if (existingLog.cat_id !== catId) {
      return NextResponse.json({ error: 'Forbidden: Cannot change the cat associated with this log via this operation.' }, { status: 403 });
    }

    const updatedLog = await prisma.$transaction(async (tx) => {
      const log = await tx.cat_weight_logs.update({
        where: { id: logId },
        data: {
          weight: weight,
          date: logDate,
          notes: notes,
          measured_by: authUserId, // Update measured_by to current user if desired, or keep original
          // cat_id: catId, // cat_id should not change here, already verified
        },
      });

      // After updating, sync the cat's weight with the potentially new latest log
      await syncCatWeightWithLatestLog(tx, catId);

      return log;
    });

    return NextResponse.json(updatedLog, { status: 200 });

  } catch (error) {
    console.error('[API PUT /api/weight-logs] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE handler for deleting a weight log
export async function DELETE(request: NextRequest) {
  try {
    const headersList = headers();
    const authUserId = headersList.get('X-User-ID');

    if (!authUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const logId = searchParams.get('id');
    if (!logId || !z.string().uuid().safeParse(logId).success) {
      return NextResponse.json({ error: 'Valid log ID query parameter is required' }, { status: 400 });
    }

    // Find the log to be deleted to get the catId
    const logToDelete = await prisma.cat_weight_logs.findUnique({
      where: { id: logId },
      select: { cat_id: true }
    });

    if (!logToDelete) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    const catId = logToDelete.cat_id;

    // Authorization: Check if user owns the cat associated with the log being deleted
    const cat = await prisma.cats.findUnique({
      where: { id: catId },
      select: { owner_id: true }
    });

    if (!cat || cat.owner_id !== authUserId) {
      return NextResponse.json({ error: 'Forbidden: You do not own the cat associated with this log.' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // Delete the log
      await tx.cat_weight_logs.delete({
        where: { id: logId },
      });

      // After deleting, sync the cat's weight with the new latest log
      await syncCatWeightWithLatestLog(tx, catId);
    });

    return NextResponse.json({ message: 'Weight log deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('[API DELETE /api/weight-logs] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 