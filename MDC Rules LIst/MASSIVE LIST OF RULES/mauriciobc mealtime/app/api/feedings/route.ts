import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from "zod";
const prisma = new PrismaClient();
// Add top-level logging
console.log(`[API /feedings] Module loaded. typeof prisma: ${typeof prisma}. Keys:`, prisma ? Object.keys(prisma) : 'prisma is null/undefined');
console.log(`[API /feedings] DATABASE_URL set: ${!!process.env.DATABASE_URL}`); // Check if DB URL env var exists
// Remove direct PrismaClient import
// import { PrismaClient } from '@prisma/client';
// Remove unused Supabase SSR imports related to client creation
// import { ReadonlyRequestCookies, RequestCookies } from 'next/dist/server/web/spec-extension/cookies'; // Import types
// import { createServerClient, type CookieOptions } from '@supabase/ssr';
// import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { isDuplicateFeeding } from '@/lib/services/feeding-notification-service';
import { createNotification } from '@/lib/services/notificationService';

// Log Runtime
console.log('[/api/feedings] Runtime:', process.env.NEXT_RUNTIME);

// Explicitly set runtime to Node.js
export const runtime = 'nodejs';

// Remove direct instantiation
// const prisma = new PrismaClient();

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Restore the createFeedingSchema definition
const createFeedingSchema = z.object({
  catId: z.string().uuid({ message: "Invalid cat ID format" }),
  amount: z.number().positive().nullable().optional(), // Allow optional amount
  notes: z.string().max(255).optional(), // Allow optional notes
});

// POST /api/feedings - Criar um novo registro de alimentação
export async function POST(request: NextRequest) {
  const headersList = await headers();
  const authUserId = headersList.get('X-User-ID');

  if (!authUserId) {
    console.log("[POST /api/feedings] Failed: Missing X-User-ID header");
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log("[POST /api/feedings] Received body:", body);

    // Validate the request body against schema (userId removed)
    const validationResult = createFeedingSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("[POST /api/feedings] Invalid body:", validationResult.error.format());
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { catId, amount, notes } = validationResult.data;
    const mealType = body.meal_type || "manual"; // Default to 'manual' if not provided (e.g., Feed Now)

    // --- Authorization & Validation --- 
    // Fetch cat and user profile in parallel to verify ownership and get householdId
    console.log(`[POST /api/feedings] Verifying access for user ${authUserId} and cat ${catId}`);
    const [cat, userProfile, lastFeedingLog] = await Promise.all([
        prisma.cats.findUnique({ where: { id: catId }, select: { id: true, name: true, photo_url: true, household_id: true, feeding_interval: true, portion_size: true } }),
        prisma.household_members.findFirst({ 
            where: { user_id: authUserId }, 
            select: { household_id: true } 
        }),
        prisma.feeding_logs.findFirst({
          where: { cat_id: catId },
          orderBy: { fed_at: 'desc' }
        })
    ]);

    const userHouseholdId = userProfile?.household_id; // Get householdId from the join table result

    if (!cat) {
        console.log(`[POST /api/feedings] Cat not found: ${catId}`);
        return NextResponse.json({ error: 'Cat not found' }, { status: 404 });
    }
    if (!userHouseholdId) {
        console.log(`[POST /api/feedings] User ${authUserId} not associated with any household.`);
        return NextResponse.json({ error: 'User household not found' }, { status: 403 }); 
    }
    if (cat.household_id !== userHouseholdId) {
        console.log(`[POST /api/feedings] Access Denied: Cat ${catId} (household ${cat.household_id}) does not belong to user ${authUserId} (household ${userHouseholdId})`);
        return NextResponse.json({ error: 'Access denied: Cat does not belong to user\'s household' }, { status: 403 });
    }
    console.log(`[POST /api/feedings] Access granted for user ${authUserId} to cat ${catId} in household ${userHouseholdId}`);
    // --- End Authorization & Validation --- 

    // --- Duplicate Feeding Detection ---
    if (lastFeedingLog && isDuplicateFeeding(new Date(lastFeedingLog.fed_at))) {
      // Create warning notification for duplicate
      try {
        await createNotification({
          title: 'Alimentação duplicada',
          message: `O gato ${cat.name} já foi alimentado recentemente.`,
          type: 'warning',
          metadata: {
            catId: cat.id,
            householdId: String(cat.household_id),
            actionUrl: `/cats/${cat.id}`,
            duplicate: true,
          },
        });
      } catch (notifyError) {
        console.error('[POST /api/feedings] Failed to create duplicate warning notification:', notifyError);
      }
      return NextResponse.json({ error: 'Tentativa de alimentação duplicada' }, { status: 409 });
    }
    // --- End Duplicate Feeding Detection ---

    // Create the feeding record using derived IDs
    console.log(`[POST /api/feedings] Creating feeding log...`);
    const feedingLog = await prisma.feeding_logs.create({
      data: {
        cat_id: catId,
        meal_type: mealType, 
        amount: amount !== undefined && amount !== null ? new Prisma.Decimal(amount) : undefined, // Use Prisma.Decimal for amount
        unit: body.unit || 'g', // Add required unit field, default to grams
        notes: notes, // Use validated notes
        fed_by: authUserId, // Use ID from header
        household_id: String(userHouseholdId), // Ensure household_id is a string
        fed_at: new Date(), // Use current timestamp for feeding time
      },
      include: { // Include feeder details for the response, matching GET
        feeder: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true
          }
        }
      }
    });
    console.log(`[POST /api/feedings] Feeding log created successfully: ${feedingLog.id}`);

    // --- Missed Feeding Detection ---
    // If the feeding is overdue by threshold, create a warning notification
    // For this, you may need to fetch the scheduled time (if available)
    // For now, assume the scheduled time is the same as the current time (could be improved)
    // If you have a way to get the scheduled time, use it here
    // Example: if (isFeedingMissed(scheduledTime)) { ... }
    // For now, skip if not available

    // --- Event-driven notification: feeding ---
    try {
      await createNotification({
        title: `Alimentação registrada para o gato`,
        message: `O gato foi alimentado com sucesso.`,
        type: 'feeding',
        metadata: {
          catId: catId,
          userId: authUserId,
          feedingLogId: feedingLog.id,
          householdId: userHouseholdId,
        },
      });
    } catch (notifyError) {
      console.error('[POST /api/feedings] Failed to create feeding notification:', notifyError);
    }
    // --- End notification ---

    // --- Missed Feeding Warning Notification (if possible) ---
    // If you have a scheduled time, check if missed and notify
    // Example placeholder:
    // const scheduledTime = ...; // Fetch from schedule if available
    // if (scheduledTime && isFeedingMissed(scheduledTime)) { ... }

    // Notify all other users in the household
    const householdMembers = await prisma.household_members.findMany({
      where: {
        household_id: userHouseholdId,
        user_id: { not: authUserId }
      },
      select: { user_id: true }
    });

    const feederProfile = await prisma.profiles.findUnique({
      where: { id: authUserId },
      select: { full_name: true }
    });

    const notificationsData = householdMembers.map(member => ({
      id: crypto.randomUUID(),
      user_id: member.user_id,
      title: "Alimentação registrada",
      message: `Seu gato ${cat.name} foi alimentado por ${feederProfile?.full_name || "alguém"}.`,
      type: "feeding",
      metadata: {
        catId: cat.id,
        catName: cat.name,
        feederId: authUserId,
        feederName: feederProfile?.full_name,
        fedAt: new Date().toISOString()
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    if (notificationsData.length > 0) {
      await prisma.notifications.createMany({ data: notificationsData });
    }

    // Schedule a feeding reminder for (now + feeding_interval) if feeding_interval is set
    if (cat.feeding_interval && cat.feeding_interval > 0) {
      const reminderTime = new Date(Date.now() + cat.feeding_interval * 60 * 60 * 1000); // feeding_interval is in hours
      const reminderMembers = householdMembers.map(member => member.user_id);
      console.log('[SCHEDULING] Household members for reminders:', reminderMembers);
      const reminderNotifications = reminderMembers.map(userId => ({
        id: crypto.randomUUID(),
        userId: userId,
        catId: cat.id,
        type: "reminder",
        title: "Lembrete de alimentação",
        message: `Está na hora de alimentar o gato ${cat.name}.`,
        deliverAt: reminderTime,
        delivered: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      console.log('[SCHEDULING] Reminder notifications to insert:', reminderNotifications);
      if (reminderNotifications.length > 0) {
        try {
          const result = await prisma.scheduledNotification.createMany({ data: reminderNotifications });
          console.log('[SCHEDULING] Scheduled notifications created successfully:', result);
        } catch (err) {
          console.error('[SCHEDULING] Failed to create scheduled notifications:', err, reminderNotifications);
        }
      } else {
        console.log('[SCHEDULING] No reminder notifications to schedule.');
      }
    }

    // Return the created record in the format expected by the context
    return NextResponse.json(feedingLog, { status: 201 }); 

  } catch (error) {
    console.error("[POST /api/feedings] Error creating feeding log:", error);
    return NextResponse.json(
      { error: "Failed to create feeding log", details: (error instanceof Error) ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/feedings - Obter registros de alimentação de um usuário
export async function GET(request: NextRequest) {
  const headersList = await headers();
  const authUserId = headersList.get('X-User-ID');
  const { searchParams } = new URL(request.url);
  const householdId = searchParams.get('householdId');

  if (!authUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (!householdId) {
    return NextResponse.json({ error: 'Household ID is required' }, { status: 400 });
  }

  // Verify user access
  try {
    const userAccess = await prisma.household_members.findFirst({
      where: { household_id: householdId, user_id: authUserId }
    });
    if (!userAccess) {
      return NextResponse.json({ error: 'Access denied to this household' }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to verify household access', details: (error instanceof Error) ? error.message : 'Unknown error' }, { status: 500 });
  }

  // Fetch feedings
  try {
    const feedings = await prisma.feeding_logs.findMany({
      where: { household_id: householdId },
      include: {
        feeder: { select: { id: true, full_name: true, avatar_url: true } }
      },
      orderBy: { fed_at: 'desc' },
      take: 50
    });
    return NextResponse.json(feedings);
  } catch (error) {
    console.error("[GET /api/feedings] Error fetching feeding data:", error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch feeding data', 
        details: (error instanceof Error) ? error.message : 'Unknown database error' 
      }, 
      { status: 500 }
    );
  }
}