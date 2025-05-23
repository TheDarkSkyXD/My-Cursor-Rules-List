import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';
import { createRouteHandlerCookieStore } from '@/lib/supabase/cookie-store';

// Helper function to create Supabase client in API routes
async function createSupabaseRouteClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: await createRouteHandlerCookieStore()
    }
  );
}

export async function POST(req: NextRequest) {
  const requestReceivedAt = new Date().toISOString();
  try {
    // 1. Get authenticated user
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn(`[SCHEDULE][API] Unauthorized scheduling attempt at ${requestReceivedAt}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate body
    const body = await req.json();
    const { type, title, message, deliverAt, catId } = body;
    console.log(`[SCHEDULE][API] Scheduling request received`, {
      timestamp: requestReceivedAt,
      userId: user.id,
      payload: body
    });
    if (!type || !title || !message || !deliverAt) {
      console.warn(`[SCHEDULE][API] Missing required fields`, { userId: user.id, payload: body });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const deliverAtDate = new Date(deliverAt);
    if (isNaN(deliverAtDate.getTime()) || deliverAtDate <= new Date()) {
      console.warn(`[SCHEDULE][API] Invalid deliverAt`, { userId: user.id, deliverAt });
      return NextResponse.json({ error: 'deliverAt must be a valid future ISO-8601 date string (UTC)' }, { status: 400 });
    }

    // 3. Create scheduled notification
    const scheduled = await prisma.scheduledNotification.create({
      data: {
        userId: user.id,
        catId: catId || null,
        type,
        title,
        message,
        deliverAt: deliverAtDate,
      },
    });
    console.log(`[SCHEDULE][API] Scheduled notification created successfully`, {
      userId: user.id,
      scheduledId: scheduled.id,
      deliverAt: scheduled.deliverAt,
      catId: scheduled.catId
    });
    return NextResponse.json(scheduled, { status: 201 });
  } catch (err: any) {
    console.error('[SCHEDULE][API] Error scheduling notification:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 