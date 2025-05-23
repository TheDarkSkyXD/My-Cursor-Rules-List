import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';
import { createRouteHandlerCookieStore } from '@/lib/supabase/cookie-store';

export const dynamic = 'force-dynamic';

// GET /api/notifications/unread-count - Get the count of unread notifications
export async function GET(request: NextRequest) {
  // Use Supabase session/cookie to authenticate user (matches /api/notifications)
  const supabase = await createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: await createRouteHandlerCookieStore()
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Count unread notifications for the user
    const count = await prisma.notifications.count({
      where: {
        user_id: user.id,
        is_read: false
      }
    });
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get unread count' },
      { status: 500 }
    );
  }
} 