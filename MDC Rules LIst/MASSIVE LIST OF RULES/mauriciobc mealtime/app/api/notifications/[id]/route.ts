import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { createRouteHandlerCookieStore } from '@/lib/supabase/cookie-store';

// Helper function to create Supabase client (reuse from other routes)
async function createSupabaseRouteClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: await createRouteHandlerCookieStore()
    }
  );
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const { params } = await context;
  const notificationId = params.id;
  console.log(`\n--- [DELETE /api/notifications/${notificationId}] Start ---`);

  try {
    // Get authenticated user using getUser() for security
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`[DELETE /${notificationId}] Authorization Error:`, authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authUserId = user.id;
    console.log(`[DELETE /${notificationId}] Authenticated User ID: ${authUserId}`);

    if (!notificationId || typeof notificationId !== 'string' || notificationId.length !== 36) { 
      console.error(`[DELETE /${notificationId}] Invalid Notification ID format:`, notificationId);
      return NextResponse.json({ error: 'Invalid Notification ID format' }, { status: 400 });
    }

    // Fetch notification to verify ownership via user_id
    console.log(`[DELETE /${notificationId}] Fetching notification ${notificationId} to verify ownership`);
    const notification = await prisma.notifications.findUnique({
      where: { id: notificationId },
      select: { user_id: true }
    });

    if (!notification) {
      console.log(`[DELETE /${notificationId}] Notification ${notificationId} not found, returning 404`);
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Check ownership using the authenticated user ID
    if (notification.user_id !== authUserId) {
      console.error(`[DELETE /${notificationId}] Forbidden: User ${authUserId} does not own notification ${notificationId} (owner: ${notification.user_id})`);
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    // Delete the notification
    console.log(`[DELETE /${notificationId}] Deleting notification ${notificationId} for user ${authUserId}`);
    await prisma.notifications.delete({
      where: { 
        id: notificationId,
        user_id: authUserId // Ensure user owns the record being deleted
      },
    });
    console.log(`[DELETE /${notificationId}] Notification deleted successfully`);

    // Revalidate cache
    console.log(`[DELETE /${notificationId}] Revalidating cache tags...`);
    revalidateTag('notifications');
    revalidateTag('unread-count');

    console.log(`[DELETE /${notificationId}] Sending success response (Status 204)`);
    return new NextResponse(null, { status: 204 }); // Return 204 No Content

  } catch (error) {
    console.error(`[DELETE /api/notifications/${notificationId}] Error:`, error);
    
    if (error.code === 'P2021') {
      return NextResponse.json({ error: 'Table not found. Please check if migrations are applied.' }, { status: 500 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Data conflict.' }, { status: 409 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  const { params } = await context;
  const supabase = await createSupabaseRouteClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { is_read } = await request.json();

  const { data: notification, error } = await supabase
    .from('notifications')
    .update({ is_read })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(notification);
} 