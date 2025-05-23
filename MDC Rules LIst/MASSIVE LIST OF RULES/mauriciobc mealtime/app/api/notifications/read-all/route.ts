import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';

// POST /api/notifications/read-all - Mark all notifications as read
export async function POST() {
  console.log("\n--- [POST /api/notifications/read-all] Start ---");

  const headersList = await headers();
  const authUserId = headersList.get('X-User-ID');

  if (!authUserId) {
    console.error('[POST /api/notifications/read-all] Authorization Error: No user ID in headers');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log(`[POST /api/notifications/read-all] Authenticated User ID: ${authUserId}`);

  try {
    // 2. Update all unread notifications for the user
    const updateResult = await prisma.notifications.updateMany({
      where: {
        user_id: authUserId,
        is_read: false
      },
      data: {
        is_read: true,
        updated_at: new Date()
      }
    });

    console.log(`[POST /api/notifications/read-all] Updated ${updateResult.count} notifications for user ${authUserId}`);

    // 3. Revalidate cache
    revalidateTag('notifications');
    revalidateTag('unread-count');

    return NextResponse.json({ 
      message: 'All notifications marked as read for user',
      count: updateResult.count 
    });
  } catch (error) {
    console.error('[POST /api/notifications/read-all] Error:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
} 