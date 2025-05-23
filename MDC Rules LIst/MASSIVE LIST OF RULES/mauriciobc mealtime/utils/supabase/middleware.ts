import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { logger } from '@/lib/monitoring/logger';
import { createMiddlewareCookieStore } from '@/lib/supabase/cookie-store';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/profile',
  '/settings',
  '/households',
  '/cats',
  '/notifications',
  '/history',
  '/schedules',
  '/statistics',
  '/feedings',
  '/join',
  // Add other protected routes here
];

// Routes that are public and don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/auth/callback',
  '/auth/confirm',
  '/auth/reset',
  // Add other public routes here
];

// Routes that should skip auth checks completely
const SKIP_AUTH_ROUTES = [
  '/_next',
  '/api/auth',
  '/api/households',
  '/api/cats',
  '/static',
  '/images',
  '/favicon.ico',
  '/manifest.json',
  '/robots.txt',
  '/site.webmanifest',
  '/sitemap.xml',
  '/apple-touch-icon',
  '/android-chrome',
  '/mstile',
  '/browserconfig.xml',
  // Add common static asset extensions
];

// Helper function to create Supabase client in middleware
function createSupabaseMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: createMiddlewareCookieStore(request, response)
    }
  );
}

const isPublicRoute = (path: string) =>
  PUBLIC_ROUTES.some(route => path.startsWith(route));

// Helper to skip auth for static assets by extension
function hasStaticAssetExtension(path: string): boolean {
  return /\.(svg|png|jpg|jpeg|gif|webp|ico|json|xml)$/i.test(path);
}

const shouldSkipAuth = (path: string) =>
  SKIP_AUTH_ROUTES.some(route => path.startsWith(route)) || hasStaticAssetExtension(path);

const isProtectedRoute = (path: string) =>
  PROTECTED_ROUTES.some(route => path.startsWith(route));

// Default cookie options for auth-related cookies
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  priority: 'high',
  maxAge: 60 * 60 * 24 * 365 // 1 year
} as const;

// Auth-related cookie names that need special handling
const AUTH_COOKIE_NAMES = [
  'sb-access-token',
  'sb-refresh-token',
  'supabase-auth-token',
];

export async function updateSession(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;
  
  // Prevent redirect loops
  const redirectCount = parseInt(request.headers.get('x-redirect-count') || '0');
  if (redirectCount > 3) {
    logger.error('[updateSession] Detected potential redirect loop:', {
      path: currentPath,
      redirectCount
    });
    return NextResponse.next();
  }

  // Skip auth check for static assets and API routes
  if (shouldSkipAuth(currentPath)) {
    return NextResponse.next();
  }

  // Skip auth check for public routes
  if (isPublicRoute(currentPath)) {
    return NextResponse.next();
  }

  // Create an initial response that will be modified by cookie operations
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createSupabaseMiddlewareClient(request, response);

  try {
    // Get the user state
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Handle auth errors
    if (userError) {
      // Only log as error for protected routes; otherwise, log as info to avoid noisy logs for expected cases (e.g., /auth/auth-code-error)
      if (isProtectedRoute(currentPath)) {
        logger.error('[updateSession] Supabase user error:', { 
          message: userError.message, 
          code: userError.status, 
          name: userError.name, 
          path: currentPath 
        });
      } else {
        logger.info('[updateSession] Supabase user error (non-protected route, likely expected):', { 
          message: userError.message, 
          code: userError.status, 
          name: userError.name, 
          path: currentPath 
        });
      }

      // If there's an error checking the user, treat as unauthenticated for protected routes
      if (isProtectedRoute(currentPath)) {
        logger.warn(`[updateSession] Redirecting due to userError on protected path: ${currentPath}`);
        const redirectUrl = new URL('/login', request.url);
        if (currentPath !== '/') {
          redirectUrl.searchParams.set('redirectTo', currentPath);
        }
        response = NextResponse.redirect(redirectUrl);
        response.headers.set('x-redirect-count', (redirectCount + 1).toString());
        return response;
      }
      // Allow non-protected routes even if getUser has error (might be transient)
      logger.warn(`[updateSession] Allowing request despite userError on non-protected path: ${currentPath}`);
      return response;
    }

    // --- Authentication Logic (Based on getUser result) ---

    // Redirect authenticated users away from public routes (login, signup)
    if (isPublicRoute(currentPath) && user) {
      logger.debug(`[updateSession] Authenticated user accessing public route ${currentPath}. Redirecting to /.`);
      response = NextResponse.redirect(new URL('/', request.url));
      response.headers.set('x-redirect-count', (redirectCount + 1).toString());
      return response;
    }

    // Redirect unauthenticated users away from protected routes
    if (isProtectedRoute(currentPath) && !user) {
      logger.debug(`[updateSession] Unauthenticated user accessing protected route ${currentPath}. Redirecting to login.`);
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', currentPath);
      response = NextResponse.redirect(redirectUrl);
      response.headers.set('x-redirect-count', (redirectCount + 1).toString());
      return response;
    }
    
    // If none of the above conditions caused a redirect, the user is allowed access
    logger.debug(`[updateSession] Auth check passed for path: ${currentPath}. User authenticated: ${!!user}`);
    return response;

  } catch (error) {
    logger.error('[updateSession] Unexpected error during auth check:', error);
    // Redirect on generic error only for protected routes
    if (isProtectedRoute(currentPath)) {
       logger.warn(`[updateSession] Redirecting due to unexpected error on protected path: ${currentPath}`);
       const redirectUrl = new URL('/login', request.url);
       if (currentPath !== '/') {
          redirectUrl.searchParams.set('redirectTo', currentPath);
       }
       response = NextResponse.redirect(redirectUrl);
       response.headers.set('x-redirect-count', (redirectCount + 1).toString());
       return response;
    }
    // Allow request on non-protected routes even if there's an error
    logger.warn(`[updateSession] Allowing request despite unexpected error on non-protected path: ${currentPath}`);
    return response;
  }
}

// Re-export createMiddlewareClient for backward compatibility
export const createMiddlewareClient = async (request: NextRequest, response: NextResponse) => {
  return { supabase: createSupabaseMiddlewareClient(request, response), response };
}; 