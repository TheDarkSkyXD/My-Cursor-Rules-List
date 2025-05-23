import { NextResponse } from 'next/server';

/**
 * Applies security headers to a NextResponse object
 * @param response - The NextResponse object to modify
 * @param request - Optional request object for dynamic CSP configuration
 */
export function applySecurityHeaders(response: NextResponse, nonce?: string) {
  // Basic security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict Transport Security
  // Only enable HSTS in production to avoid issues with local development
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Consider restricting unsafe-inline/eval in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: https://accounts.google.com https://*.googleusercontent.com https://api.dicebear.com",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://*.supabase.net",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    nonce ? `script-src 'nonce-${nonce}'` : '',
  ].filter(Boolean);

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  return response;
} 