import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

// GET /api/feedings/[id] - Buscar detalhes de um registro de alimentação
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const headersList = await headers();
  const authUserId = headersList.get('X-User-ID');
  const logId = context.params.id;

  if (!authUserId) {
    console.log(`[GET /api/feedings/${logId}] Failed: Missing X-User-ID header`);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!logId) {
    return NextResponse.json({ error: 'ID do registro inválido' }, { status: 400 });
  }

  console.log(`[GET /api/feedings/${logId}] Request from user ${authUserId}`);

  try {
    // Fetch log including household ID for verification
    const feedingLog = await prisma.feeding_logs.findUnique({
      where: { id: logId },
      include: {
        cat: {
          select: {
            id: true,
            name: true,
            photo_url: true,
            household_id: true
          }
        },
        feeder: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true
          }
        }
      }
    });

    if (!feedingLog) {
      console.log(`[GET /api/feedings/${logId}] Failed: Feeding log not found`);
      return NextResponse.json(
        { error: 'Registro de alimentação não encontrado' },
        { status: 404 }
      );
    }

    // Verify user belongs to the household associated with the log
    const logHouseholdId = feedingLog.household_id;
    if (!logHouseholdId) {
      console.error(`[GET /api/feedings/${logId}] Failed: Log ${logId} has no household ID.`);
      return NextResponse.json({ error: 'Log is not associated with a household' }, { status: 500 });
    }

    console.log(`[GET /api/feedings/${logId}] Verifying user ${authUserId} membership in household ${logHouseholdId}`);
    const userAccess = await prisma.household_members.findFirst({
      where: {
        user_id: authUserId,
        household_id: logHouseholdId
      },
      select: { user_id: true }
    });

    if (!userAccess) {
      console.log(`[GET /api/feedings/${logId}] Failed: User ${authUserId} not member of household ${logHouseholdId}`);
      return NextResponse.json({ error: 'Access denied: User cannot view this log' }, { status: 403 });
    }
    console.log(`[GET /api/feedings/${logId}] User ${authUserId} authorized.`);

    // Transform the data to match the FeedingLog interface
    const transformedLog = {
      id: feedingLog.id,
      catId: feedingLog.cat_id,
      userId: feedingLog.fed_by,
      timestamp: feedingLog.fed_at,
      portionSize: feedingLog.amount,
      notes: feedingLog.notes,
      mealType: feedingLog.meal_type,
      householdId: feedingLog.household_id,
      cat: feedingLog.cat ? {
        id: feedingLog.cat.id,
        name: feedingLog.cat.name,
        photoUrl: feedingLog.cat.photo_url
      } : undefined,
      user: feedingLog.feeder ? {
        id: feedingLog.feeder.id,
        name: feedingLog.feeder.full_name,
        avatar: feedingLog.feeder.avatar_url
      } : undefined
    };

    return NextResponse.json(transformedLog);
  } catch (error) {
    console.error(`[GET /api/feedings/${logId}] Error fetching feeding log:`, error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao buscar o registro de alimentação', details: (error instanceof Error) ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/feedings/[id] - Excluir um registro de alimentação
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const headersList = await headers();
  const authUserId = headersList.get('X-User-ID');
  const logId = context.params.id;

  if (!authUserId) {
    console.log(`[DELETE /api/feedings/${logId}] Failed: Missing X-User-ID header`);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  console.log(`[DELETE /api/feedings/${logId}] Attempting delete by user ${authUserId}`);

  try {
    console.log(`[DELETE /api/feedings/${logId}] Fetching feeding log...`);
    const feedingLog = await prisma.feeding_logs.findUnique({
      where: { id: logId },
      select: { household_id: true }
    });

    if (!feedingLog) {
      console.log(`[DELETE /api/feedings/${logId}] Failed: Feeding log not found`);
      return NextResponse.json({ error: 'Feeding log not found' }, { status: 404 });
    }

    const householdId = feedingLog.household_id;
    if (!householdId) {
      console.error(`[DELETE /api/feedings/${logId}] Failed: Log ${logId} has no household ID.`);
      return NextResponse.json({ error: 'Log is not associated with a household' }, { status: 500 });
    }

    console.log(`[DELETE /api/feedings/${logId}] Verifying user ${authUserId} membership in household ${householdId}`);
    const userAccess = await prisma.household_members.findFirst({
      where: {
        user_id: authUserId,
        household_id: householdId
      },
      select: { user_id: true }
    });

    if (!userAccess) {
      console.log(`[DELETE /api/feedings/${logId}] Failed: User ${authUserId} not member of household ${householdId}`);
      return NextResponse.json({ error: 'Access denied: User does not belong to this household' }, { status: 403 });
    }
    console.log(`[DELETE /api/feedings/${logId}] User ${authUserId} authorized.`);

    console.log(`[DELETE /api/feedings/${logId}] Deleting log...`);
    await prisma.feeding_logs.delete({
      where: { id: logId }
    });
    console.log(`[DELETE /api/feedings/${logId}] Log deleted successfully.`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /api/feedings/${logId}] Error deleting feeding log:`, error);
    if (error instanceof Error && (error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Log not found during delete attempt.' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'An error occurred while deleting the feeding log', details: (error instanceof Error) ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 