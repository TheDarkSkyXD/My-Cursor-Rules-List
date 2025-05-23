import { CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/monitoring/logger';

/**
 * Creates a cookie store for middleware usage
 */
export function createMiddlewareCookieStore(request: NextRequest, response: NextResponse) {
  return {
    get(name: string) {
      return request.cookies.get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        response.cookies.set(name, value, options);
      } catch (error) {
        logger.error('[Supabase Cookie Store] Middleware error setting cookie:', { name, error });
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        response.cookies.delete(name, options);
      } catch (error) {
        logger.error('[Supabase Cookie Store] Middleware error removing cookie:', { name, error });
      }
    },
    getAll() {
      return request.cookies.getAll();
    }
  };
}

/**
 * Creates a cookie store for route handlers and server components
 */
export async function createRouteHandlerCookieStore() {
  // Await the cookies() call before using it
  const cookieStore = await cookies();
  
  return {
    async get(name: string) {
      const cookie = await cookieStore.get(name);
      return cookie?.value;
    },
    async set(name: string, value: string, options: CookieOptions) {
      try {
        await cookieStore.set(name, value, options);
      } catch (error) {
        logger.error('[Supabase Cookie Store] Route Handler error setting cookie:', { name, error });
      }
    },
    async remove(name: string, options: CookieOptions) {
      try {
        await cookieStore.delete(name, options);
      } catch (error) {
        logger.error('[Supabase Cookie Store] Route Handler error removing cookie:', { name, error });
      }
    },
    async getAll() {
      return await cookieStore.getAll();
    },
    async setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Set each cookie using the Next.js cookie store
          cookieStore.set(name, value, options);
        });
      } catch (error) {
        logger.error('[Supabase Cookie Store] Route Handler error in setAll:', { error });
      }
    }
  };
}