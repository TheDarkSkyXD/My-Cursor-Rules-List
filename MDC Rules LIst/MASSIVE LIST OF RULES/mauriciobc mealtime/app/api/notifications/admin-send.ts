import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/services/notificationService';
import { createServerClient } from '@supabase/ssr';
import { createRouteHandlerCookieStore } from '@/lib/supabase/cookie-store';

export async function POST(request: NextRequest) {
  // Authenticate and check admin role
  const supabase = await createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: await createRouteHandlerCookieStore()
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Fetch user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
  }
  // Parse and validate body
  const { title, message, type, metadata = {} } = await request.json();
  if (!title || !message || !type || !['system', 'info'].includes(type)) {
    return NextResponse.json({ error: 'Invalid input: title, message, and type (system/info) required' }, { status: 400 });
  }
  try {
    const notification = await createNotification({ title, message, type, metadata });
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create notification', details: (error instanceof Error) ? error.message : error }, { status: 500 });
  }
} 