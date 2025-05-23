import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/monitoring/logger';
import { createRouteHandlerCookieStore } from '@/lib/supabase/cookie-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    logger.debug('[Auth Callback] Processing auth callback', {
      hasCode: !!code,
      hasError: !!error,
      next
    });

    // Handle OAuth errors
    if (error || errorDescription) {
      logger.error('[Auth Callback] OAuth error:', { error, errorDescription });
      return NextResponse.redirect(new URL(`/auth/auth-code-error?error=${encodeURIComponent(errorDescription || error || '')}`, request.url));
    }

    if (!code) {
      logger.error('[Auth Callback] No code provided');
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
    }

    // Create cookie stores
    const asyncCookieStore = await createRouteHandlerCookieStore();

    // Verify environment variables and initialize Supabase client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logger.error('[Auth Callback] Missing required environment variables');
      throw new Error('Missing required environment variables');
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: asyncCookieStore,
      }
    );
    
    // Exchange the code for a session
    const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      logger.error('[Auth Callback] Error exchanging code for session:', {
        message: exchangeError.message,
        name: exchangeError.name,
        status: exchangeError.status
      });
      return NextResponse.redirect(new URL(`/auth/auth-code-error?error=${encodeURIComponent(exchangeError.message)}`, request.url));
    }

    if (!exchangeData.session) {
      logger.error('[Auth Callback] No session returned after code exchange');
      return NextResponse.redirect(new URL('/auth/auth-code-error?error=No+session+returned', request.url));
    }

    // Verify the user's authentication state securely
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      logger.error('[Auth Callback] Failed to verify user authentication:', { error: userError });
      return NextResponse.redirect(new URL('/auth/auth-code-error?error=Authentication+verification+failed', request.url));
    }

    // Verify the user IDs match
    if (user.id !== exchangeData.session.user.id) {
      logger.error('[Auth Callback] User ID mismatch:', {
        sessionUserId: exchangeData.session.user.id,
        verifiedUserId: user.id
      });
      return NextResponse.redirect(new URL('/auth/auth-code-error?error=Authentication+verification+failed', request.url));
    }

    logger.info('[Auth Callback] Successfully authenticated user', {
      userId: user.id,
      next
    });

    // Create the response with the redirect
    const response = NextResponse.redirect(new URL(next, request.url));

    // Verify all required cookies were set
    const requiredCookies = ['sb-access-token', 'sb-refresh-token'];
    const missingCookies = [];
    
    // Check each cookie asynchronously
    for (const name of requiredCookies) {
      const value = await asyncCookieStore.get(name);
      if (!value) {
        missingCookies.push(name);
      }
    }
    
    if (missingCookies.length > 0) {
      logger.error('[Auth Callback] Missing required auth cookies:', { missingCookies });
      return NextResponse.redirect(new URL(`/auth/auth-code-error?error=Missing+auth+cookies:+${missingCookies.join(',')}`, request.url));
    }

    // Add security headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    return response;
  } catch (error) {
    logger.error('[Auth Callback] Unexpected error:', error);
    return NextResponse.redirect(new URL(`/auth/auth-code-error?error=${encodeURIComponent((error as Error).message || 'Unexpected error')}`, request.url));
  }
} 