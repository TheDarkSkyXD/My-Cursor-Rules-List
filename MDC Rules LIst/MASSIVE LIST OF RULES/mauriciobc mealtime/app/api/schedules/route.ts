import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { handleApiError, handleAuthError, handleValidationError } from '@/lib/utils/api-error-handling';

// GET /api/schedules - Listar agendamentos for a specific household
export async function GET(request: NextRequest) {
  const headersList = await headers();
  const authUserId = headersList.get('X-User-ID');

  if (!authUserId) {
    return handleAuthError('Missing X-User-ID header', 'GET /api/schedules');
  }

  try {
    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get('householdId');

    if (!householdId) {
      return handleValidationError('Household ID is required', 'GET /api/schedules');
    }

    // --- Authorization Check --- 
    console.log(`[GET /api/schedules] Verifying access for user ${authUserId} to household ${householdId}`);
    const userAccess = await prisma.household_members.findFirst({
      where: {
        user_id: authUserId,
        household_id: householdId,
      },
    });

    if (!userAccess) {
      return handleAuthError('Access denied to this household', 'GET /api/schedules');
    }

    // Fetch schedules for the specified household
    console.log(`[GET /api/schedules] Fetching schedules for household ${householdId}`);
    const schedules = await prisma.schedules.findMany({
      where: {
        cat: {
          household_id: householdId
        }
      },
      include: {
        cat: {
          select: { id: true, name: true }
        }
      }
    });
    console.log(`[GET /api/schedules] Found ${schedules.length} schedules for household ${householdId}`);

    // Always include a 'days' property (empty array) for frontend compatibility
    const mappedSchedules = schedules.map(s => ({
      ...s,
      days: [], // fallback, since the DB does not have this field
    }));
    return NextResponse.json(mappedSchedules);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch schedules');
  }
}

// POST /api/schedules - Criar um novo agendamento
export async function POST(request: NextRequest) {
  const headersList = await headers();
  const authUserId = headersList.get('X-User-ID');

  if (!authUserId) {
    return handleAuthError('Authentication required', 'POST /api/schedules');
  }

  try {
    const body = await request.json();
    const {
      catId,
      type,
      interval,
      times,
      enabled,
    } = body;

    if (!catId || !type) {
      return handleValidationError('Cat ID and schedule type are required', 'POST /api/schedules');
    }
    
    // --- Authorization & Validation --- 
    const [cat, userProfile] = await Promise.all([
        prisma.cats.findUnique({ where: { id: catId }, select: { household_id: true } }),
        prisma.profiles.findUnique({ where: { id: authUserId }, select: { household_members: { select: { household_id: true }, take: 1 } } })
    ]);

    const userHouseholdId = userProfile?.household_members[0]?.household_id;

    if (!cat) {
        return handleApiError(new Error('Cat not found'), 'POST /api/schedules');
    }
    if (!userHouseholdId) {
        return handleAuthError('User profile or household not found', 'POST /api/schedules');
    }
    if (cat.household_id !== userHouseholdId) {
        return handleAuthError('Access denied: Cat does not belong to user\'s household', 'POST /api/schedules');
    }

    // Validate schedule type
    if (type !== 'interval' && type !== 'fixedTime') {
      return handleValidationError('Invalid schedule type', 'POST /api/schedules');
    }

    // Validate type-specific data
    if (type === 'interval' && (!interval || interval <= 0)) {
      return handleValidationError('Interval must be greater than zero', 'POST /api/schedules');
    }
    if (type === 'fixedTime' && (!Array.isArray(times) || times.length === 0)) {
      return handleValidationError('Times array is required for fixed time schedules', 'POST /api/schedules');
    }

    // Create the schedule
    console.log(`[POST /api/schedules] Creating schedule for cat ${catId} in household ${userHouseholdId}`);
    const schedule = await prisma.schedules.create({
      data: {
        cat_id: catId,
        type: type,
        interval: type === 'interval' ? interval : null,
        times: type === 'fixedTime' ? times : [],
        enabled: enabled ?? true,
      },
      include: {
        cat: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    console.log(`[POST /api/schedules] Schedule created successfully: ${schedule.id}`);

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Failed to create schedule');
  }
}

// PATCH and DELETE handlers would go here, requiring similar header-based auth checks
// ... (PATCH and DELETE implementations omitted for brevity, but should follow the same auth pattern) 