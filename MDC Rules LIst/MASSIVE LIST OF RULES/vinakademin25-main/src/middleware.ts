import { NextRequest, NextResponse } from 'next/server'
// Note: cookies() import removed as we use request.headers directly
// Removed getPayload and configPromise imports

// Define protected paths and their required roles
// Default role upon registration is now 'user' (set in AuthContext)
const protectedPaths = [
  {
    path: '/mina-sidor', // Renamed from /dashboard
    roles: ['admin', 'instructor', 'subscriber', 'user'],
  },
  {
    path: '/kurser', // Assuming Swedish name for /courses
    roles: ['admin', 'instructor', 'subscriber', 'user'],
  },
  {
    path: '/admin', // Keep as is, matches Payload default
    roles: ['admin'],
  },
  {
    path: '/instruktor', // Assuming Swedish name for /instructor
    roles: ['admin', 'instructor'],
  },
  {
    path: '/prenumeration', // Assuming Swedish name for /subscription
    roles: ['admin', 'instructor', 'subscriber', 'user'],
  },
  {
    path: '/profil', // Renamed from /profile
    roles: ['admin', 'instructor', 'subscriber', 'user'],
  },
]

// Middleware function to protect routes
export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // Skip middleware for API routes, static files, and public routes
  // Ensure public paths match renamed routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/' ||
    pathname === '/logga-in' ||
    pathname === '/registrera' ||
    pathname === '/glomt-losenord' ||
    pathname === '/aterstall-losenord' ||
    pathname === '/verifiera-epost' ||
    pathname === '/verifiera-epost-meddelande' // Added the verification message page
  ) {
    return NextResponse.next()
  }

  // Check if the path is protected (using the updated protectedPaths)
  const protectedPath = protectedPaths.find((p) => pathname.startsWith(p.path))

  // If the path is not explicitly protected, allow access
  if (!protectedPath) {
    return NextResponse.next()
  }

  // Simple cookie presence check for authentication
  const payloadToken = request.cookies.get('payload-token')

  // If user is not authenticated and trying to access protected path, redirect to login
  if (!payloadToken && protectedPath) {
    console.log(`Middleware: No auth cookie found, redirecting to login from ${pathname}`)
    url.pathname = '/logga-in'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access login/register, redirect to dashboard
  if (payloadToken && (pathname === '/logga-in' || pathname === '/registrera')) {
    console.log(`Middleware: Auth cookie found, redirecting from ${pathname} to /mina-sidor`)
    url.pathname = '/mina-sidor'
    return NextResponse.redirect(url)
  }

  // --- Authorization Check (Removed) ---
  // Role-based authorization should now be handled within page components/layouts
  // If we reach here, the user is either authenticated accessing a protected route,
  // or accessing an unprotected route.

  console.log(`Middleware: Allowing access to ${pathname}.`)
  return NextResponse.next()
}

// Configure the paths that should be checked by this middleware
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /_next (Static files)
     * 2. /api (API routes)
     * 3. /static (Static files)
     * 4. /_vercel (Vercel internals)
     * 5. /favicon.ico, /robots.txt, /sitemap.xml (Static files)
     */
    '/((?!_next|_vercel|api|static|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
