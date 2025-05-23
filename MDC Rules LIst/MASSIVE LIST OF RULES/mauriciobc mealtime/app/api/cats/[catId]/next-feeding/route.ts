import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { calculateNextFeedingTime } from '@/lib/utils/dateUtils'; // Assuming this utility exists and works server-side

export const dynamic = 'force-dynamic'; // Ensure fresh data

export async function GET(
  request: NextRequest,
  { params }: { params: { catId: string } }
) {
  // Properly await and validate the dynamic parameter
  const resolvedParams = await Promise.resolve(params);
  const catId = resolvedParams.catId;

  if (typeof catId !== 'string' || !catId) {
    console.error(`[GET /api/cats/next-feeding] Invalid or missing catId parameter:`, catId);
    return NextResponse.json({ error: 'Invalid cat ID' }, { status: 400 });
  }

  const headersList = await headers();
  const authUserId = headersList.get('X-User-ID');

  if (!authUserId) {
    console.log(`[GET /api/cats/${catId}/next-feeding] Failed: Missing X-User-ID header`);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  console.log(`[GET /api/cats/${catId}/next-feeding] Request from user ${authUserId}`);

  try {
    // 1. Fetch Cat and Verify Ownership/Household Access
    console.log(`[GET /api/cats/${catId}/next-feeding] Fetching cat and verifying access...`);
    const cat = await prisma.cats.findUnique({
      where: { id: catId },
      select: {
        household_id: true,
        // Include schedules directly if relation exists and is needed by calculation logic
        // schedules: { 
        //    where: { enabled: true },
        //    select: { type: true, interval: true, times: true }
        // }
      }
    });

    if (!cat) {
      console.log(`[GET /api/cats/${catId}/next-feeding] Failed: Cat not found`);
      return NextResponse.json({ error: 'Cat not found' }, { status: 404 });
    }

    const householdId = cat.household_id;
    if (!householdId) {
      console.error(`[GET /api/cats/${catId}/next-feeding] Failed: Cat ${catId} has no household ID.`);
      return NextResponse.json({ error: 'Cat not linked to a household' }, { status: 500 });
    }

    const userAccess = await prisma.household_members.findFirst({
      where: {
        user_id: authUserId,
        household_id: householdId
      }
    });

    if (!userAccess) {
      console.log(`[GET /api/cats/${catId}/next-feeding] Failed: User ${authUserId} not member of household ${householdId}`);
      return NextResponse.json({ error: 'Access denied to this cat\'s household' }, { status: 403 });
    }
    console.log(`[GET /api/cats/${catId}/next-feeding] Access verified.`);

    // 2. Fetch Required Data for Calculation
    console.log(`[GET /api/cats/${catId}/next-feeding] Fetching schedules and last feeding log...`);
    const [rawSchedules, lastFeedingLog] = await Promise.all([
      prisma.schedules.findMany({
        where: {
          cat_id: catId,
          enabled: true
        },
        select: { type: true, interval: true, times: true }
      }),
      prisma.feeding_logs.findFirst({
        where: { cat_id: catId },
        orderBy: { fed_at: 'desc' },
        select: { fed_at: true }
      })
    ]);
    // Map schedules to required type for calculateNextFeedingTime
    const schedules = rawSchedules.map(sch => ({
      type: sch.type,
      interval: sch.interval,
      times: Array.isArray(sch.times) ? sch.times.join(',') : sch.times,
      enabled: true // Already filtered by enabled: true
    }));
    console.log(`[GET /api/cats/${catId}/next-feeding] Found ${schedules.length} enabled schedules.`);
    console.log(`[GET /api/cats/${catId}/next-feeding] Last feeding log time: ${lastFeedingLog?.fed_at}`);

    // 3. Calculate Next Feeding Time
    // Note: Ensure calculateNextFeedingTime handles null lastFeedingLog and empty schedules array
    // It also needs access to the current time, implicitly uses server time here.
    const nextFeedingDate = calculateNextFeedingTime(schedules, lastFeedingLog?.fed_at ?? null);

    if (nextFeedingDate) {
      console.log(`[GET /api/cats/${catId}/next-feeding] Calculated next feeding time: ${nextFeedingDate.toISOString()}`);
    } else {
      console.log(`[GET /api/cats/${catId}/next-feeding] No upcoming feeding could be calculated.`);
    }

    // 4. Return Result
    return NextResponse.json({ nextFeeding: nextFeedingDate ? nextFeedingDate.toISOString() : null });

  } catch (error) {
    console.error(`[GET /api/cats/${catId}/next-feeding] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to calculate next feeding time', details: (error instanceof Error) ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 