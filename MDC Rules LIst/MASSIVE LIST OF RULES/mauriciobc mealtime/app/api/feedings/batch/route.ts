import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from 'next/headers';
import { withError } from "@/lib/utils/api-middleware";

// Schema matching frontend payload and database requirements
const FeedingBatchSchema = z.object({
  catId: z.string(),
  portionSize: z.number().min(0),
  timestamp: z.string().datetime(),
  notes: z.string().optional(),
  status: z.enum(["Normal", "Comeu Pouco", "Recusou", "Vomitou", "Outro"]).optional(),
  mealType: z.enum(["dry", "wet", "treat", "medicine", "water"]), // Required field with specific types
  unit: z.string().default('g'), // Default to grams if not specified
});

const BatchPayloadSchema = z.object({
  logs: z.array(FeedingBatchSchema)
});

// Helper function to create Supabase client in API routes using async cookie store
function createSupabaseRouteClient() {
  const cookieStore = cookies();

  // Define the async cookie store based on utils/supabase/server.ts pattern
  const asyncCookieStore = {
    async get(name: string) {
      // Always use await with cookies()
      return (await cookieStore).get(name)?.value;
    },
    async set(name: string, value: string, options: CookieOptions) {
      try {
        // Always use await with cookies()
        (await cookieStore).set({ name, value, ...options });
      } catch (error) {
        // Handle potential errors during cookie setting in API routes
        console.error(`[Supabase Route Client] Error setting cookie ${name}:`, error);
      }
    },
    async remove(name: string, options: CookieOptions) {
      try {
        // Always use await with cookies()
        (await cookieStore).set({ name, value: '', ...options });
      } catch (error) {
        // Handle potential errors during cookie removal in API routes
        console.error(`[Supabase Route Client] Error removing cookie ${name}:`, error);
      }
    },
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: asyncCookieStore, // Use the async store
    }
  );
}

// POST /api/feedings/batch - Create multiple feeding logs
export const POST = withError(async (request: Request) => {
  const supabase = createSupabaseRouteClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  
  // Validate request body against schema
  const validationResult = BatchPayloadSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: validationResult.error.format() },
      { status: 400 }
    );
  }

  const { logs } = validationResult.data;

  // Get user's household ID
  const userHousehold = await prisma.household_members.findFirst({
    where: {
      user_id: user.id
    },
    select: {
      household_id: true
    }
  });

  if (!userHousehold) {
    return NextResponse.json(
      { error: "User not associated with any household" },
      { status: 403 }
    );
  }

  // Verify user has access to all cats through their household
  const catIds = [...new Set(logs.map(f => f.catId))];
  const accessibleCats = await prisma.cats.findMany({
    where: {
      id: { in: catIds },
      household: {
        household_members: {
          some: {
            user_id: user.id
          }
        }
      }
    },
    select: { id: true }
  });

  const accessibleCatIds = new Set(accessibleCats.map(c => c.id));
  const unauthorizedCats = catIds.filter(id => !accessibleCatIds.has(id));

  if (unauthorizedCats.length > 0) {
    return NextResponse.json(
      { error: `Unauthorized access to cats: ${unauthorizedCats.join(", ")}` },
      { status: 403 }
    );
  }

  // Create all feeding logs in a transaction
  const createdFeedings = await prisma.$transaction(
    logs.map(log => 
      prisma.feeding_logs.create({
        data: {
          cat_id: log.catId,
          household_id: userHousehold.household_id,
          meal_type: log.mealType,
          amount: log.portionSize,
          unit: log.unit,
          notes: log.notes,
          fed_by: user.id,
          fed_at: new Date(log.timestamp)
        }
      })
    )
  );

  // Scheduled notification logic for each feeding
  for (const feeding of createdFeedings) {
    // Fetch cat info (including feeding_interval and name)
    const cat = await prisma.cats.findUnique({
      where: { id: feeding.cat_id },
      select: { id: true, name: true, feeding_interval: true, household_id: true }
    });

    if (!cat || !cat.feeding_interval || cat.feeding_interval <= 0) {
      console.log(`[SCHEDULING][BATCH] Skipping scheduling for cat ${feeding.cat_id} (no interval)`);
      continue;
    }

    // Fetch household members (excluding the user who fed)
    const householdMembers = await prisma.household_members.findMany({
      where: {
        household_id: cat.household_id,
        user_id: { not: user.id }
      },
      select: { user_id: true }
    });
    const reminderMembers = householdMembers.map(member => member.user_id);
    console.log('[SCHEDULING][BATCH] Household members for reminders:', reminderMembers);

    const reminderTime = new Date(new Date(feeding.fed_at).getTime() + cat.feeding_interval * 60 * 60 * 1000);
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
    console.log('[SCHEDULING][BATCH] Reminder notifications to insert:', reminderNotifications);

    if (reminderNotifications.length > 0) {
      try {
        const result = await prisma.scheduledNotification.createMany({ data: reminderNotifications });
        console.log('[SCHEDULING][BATCH] Scheduled notifications created successfully:', result);
      } catch (err) {
        console.error('[SCHEDULING][BATCH] Failed to create scheduled notifications:', err, reminderNotifications);
      }
    } else {
      console.log('[SCHEDULING][BATCH] No reminder notifications to schedule.');
    }
  }

  return NextResponse.json({ count: createdFeedings.length, logs: createdFeedings });
}); 