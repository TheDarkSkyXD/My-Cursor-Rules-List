import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError, handleValidationError } from '@/lib/utils/api-error-handling';
import { headers } from 'next/headers';
import { createNotification } from '@/lib/services/notificationService';

// GET /api/schedules/[id] - Get a specific schedule
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = await context;
    const id = params.id;

    if (!id) {
      return handleValidationError('Invalid ID', 'GET /api/schedules/[id]');
    }

    const schedule = await prisma.schedules.findUnique({
      where: { id },
      include: {
        cat: {
          select: {
            id: true,
            name: true,
            photo_url: true
          }
        }
      }
    });

    if (!schedule) {
      return handleValidationError('Schedule not found', 'GET /api/schedules/[id]');
    }

    return NextResponse.json(schedule);
  } catch (error) {
    return handleApiError(error, 'GET /api/schedules/[id]');
  }
}

// PATCH /api/schedules/[id] - Update a schedule
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = await context;
    const id = params.id;

    if (!id) {
      return handleValidationError('Invalid ID', 'PATCH /api/schedules/[id]');
    }

    const {
      type,
      interval,
      times,
      overrideUntil
    } = await request.json();

    // Check if schedule exists
    const existingSchedule = await prisma.schedules.findUnique({
      where: { id },
      include: { cat: { select: { id: true, name: true } } }
    });

    if (!existingSchedule) {
      return handleValidationError('Schedule not found', 'PATCH /api/schedules/[id]');
    }

    // Validate schedule type if provided
    if (type && type !== 'interval' && type !== 'fixedTime') {
      return handleValidationError('Invalid schedule type', 'PATCH /api/schedules/[id]');
    }

    // Validate type-specific data
    if (type === 'interval' && interval !== undefined && interval <= 0) {
      return handleValidationError('Interval must be greater than zero', 'PATCH /api/schedules/[id]');
    }

    if (type === 'fixedTime' && times !== undefined && times.trim() === '') {
      return handleValidationError('Times are required for fixed time schedules', 'PATCH /api/schedules/[id]');
    }

    // Prepare update data
    const updateData: any = {};
    const updatedFields: string[] = [];

    if (type !== undefined) { updateData.type = type; updatedFields.push('type'); }
    if (type === 'interval' && interval !== undefined) { updateData.interval = interval; updateData.times = ''; updatedFields.push('interval'); }
    else if (type === 'fixedTime' && times !== undefined) { updateData.times = times; updateData.interval = 0; updatedFields.push('times'); }
    else {
      if (interval !== undefined && existingSchedule.type === 'interval') { updateData.interval = interval; updatedFields.push('interval'); }
      if (times !== undefined && existingSchedule.type === 'fixedTime') { updateData.times = times; updatedFields.push('times'); }
    }
    if (overrideUntil !== undefined) { updateData.overrideUntil = overrideUntil ? new Date(overrideUntil) : null; updatedFields.push('overrideUntil'); }

    // Update schedule
    const schedule = await prisma.schedules.update({
      where: { id },
      data: updateData
    });

    // Trigger system notification for schedule update
    try {
      await createNotification({
        title: 'Horário de alimentação atualizado',
        message: `O agendamento do gato ${existingSchedule.cat.name} foi atualizado.`,
        type: 'system',
        metadata: {
          catId: existingSchedule.cat.id,
          scheduleId: id,
          updatedFields,
        },
      });
    } catch (notifyError) {
      console.error('[PATCH /api/schedules/[id]] Failed to create schedule update notification:', notifyError);
    }

    return NextResponse.json(schedule);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/schedules/[id]');
  }
}

// DELETE /api/schedules/[id] - Delete a schedule
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = await context;
    const id = params.id;

    if (!id) {
      return handleValidationError('Invalid ID', 'DELETE /api/schedules/[id]');
    }

    // Check if schedule exists
    const existingSchedule = await prisma.schedules.findUnique({
      where: { id }
    });

    if (!existingSchedule) {
      return handleValidationError('Schedule not found', 'DELETE /api/schedules/[id]');
    }

    // Delete schedule
    await prisma.schedules.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Schedule deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, 'DELETE /api/schedules/[id]');
  }
} 