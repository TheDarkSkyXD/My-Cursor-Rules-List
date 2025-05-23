import { NextRequest, NextResponse } from "next/server";
import { imageCache } from '@/lib/image-cache';
import { metricsMonitor } from '@/lib/monitoring/metrics';
import { logger } from '@/lib/monitoring/logger';
import { redirectionLogger } from '@/lib/monitoring/redirection-logger';
import { updateSession } from '@/utils/supabase/middleware';
import { applySecurityHeaders } from '@/lib/utils/security-headers';
import { handleAuthError } from '@/lib/utils/auth-errors';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createMiddlewareCookieStore } from '@/lib/supabase/cookie-store';

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/api/auth/callback',
  '/_next',
  '/static',
  '/images',
  '/favicon.ico'
];

// API routes that should return JSON
const apiRoutes = [
  '/api/settings',
  '/api/users',
  '/api/households',
  '/api/notifications',
  '/api/cats',
];

// Initialize metrics
metricsMonitor.registerMetric(
  'http_requests_total',
  'Total de requisições HTTP',
  'counter'
);

metricsMonitor.registerMetric(
  'http_request_duration_ms',
  'Duração das requisições HTTP em milissegundos',
  'histogram'
);

metricsMonitor.registerMetric(
  'http_response_size_bytes',
  'Tamanho das respostas HTTP em bytes',
  'histogram'
);

metricsMonitor.registerMetric(
  'http_errors_total',
  'Total de erros HTTP',
  'counter'
);

// Helper function to check if a path matches a pattern
function isPathMatch(path: string, pattern: string): boolean {
  return path === pattern || path.startsWith(pattern + '/');
}

// Helper function to create Supabase client (reuse from API routes)
function createSupabaseRouteClient(request: NextRequest) {
  const cookieStore = createMiddlewareCookieStore(request);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieStore,
    }
  );
}

// Function to apply security headers to a response
function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
  const supabaseDomain = supabaseUrl ? supabaseUrl.hostname : '';
  const supabaseStorageDomain = supabaseDomain ? `*.${supabaseDomain.split('.').slice(1).join('.')}` : '';

  const cspHeader = [
    "default-src 'self'",
    `connect-src 'self' ${supabaseUrl ? supabaseUrl.origin : ''} wss://*.supabase.co https://accounts.google.com https://*.google.com https://*.gstatic.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.gstatic.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.gstatic.com https://*.google.com`,
    `img-src 'self' data: blob: ${supabaseStorageDomain ? `https://${supabaseStorageDomain}` : ''} https://accounts.google.com https://*.googleusercontent.com https://api.dicebear.com`,
    `frame-src 'self' ${supabaseUrl ? supabaseUrl.origin : ''} https://accounts.google.com https://*.google.com`,
    "form-action 'self' https://accounts.google.com https://*.google.com",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader.replace(/\s{2,}/g, ' ').trim());
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (request.url.startsWith('https://')) {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  logger.debug(`[Middleware Root] Processing request for: ${pathname}`, { url: request.nextUrl.toString() });

  try {
    // Check if this is an API route
    const isApiRoute = apiRoutes.some(route => pathname.startsWith(route));

    // For API routes, handle auth differently
    if (isApiRoute) {
      const supabase = createSupabaseRouteClient(request);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }

      // User is authenticated, proceed with the request
      let response = NextResponse.next();
      
      // Apply API-specific headers
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'X-User-ID, Content-Type, Authorization');
      
      return applySecurityHeaders(response, request);
    }

    // --- Delegate Core Auth Logic to updateSession for non-API routes ---
    let response = await updateSession(request);
    // -------------------------------------------------

    // Apply security headers to the response from updateSession
    response = applySecurityHeaders(response, request);

    return response;

  } catch (error) {
    logger.error('[Middleware Root] Unexpected error:', { 
      message: error.message, 
      stack: error.stack,
      path: pathname 
    });
    
    // Handle errors differently for API routes
    if (apiRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
    
    // For non-API routes, redirect to error page
    const url = request.nextUrl.clone();
    url.pathname = '/error';
    return applySecurityHeaders(NextResponse.redirect(url), request);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - site.webmanifest, robots.txt, sitemap.xml, browserconfig.xml
     * - common static asset extensions
     * 
     * Ensure this correctly excludes static assets while including API and page routes.
     */
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|robots.txt|sitemap.xml|browserconfig.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|xml)$).*)',
  ],
}; 