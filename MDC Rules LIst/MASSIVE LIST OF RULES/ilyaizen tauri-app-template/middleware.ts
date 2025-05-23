import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";

import { defaultLocale, locales } from "./i18n/settings";

/**
 * Internationalization middleware for handling locale-specific routes
 * Sets up locale prefixes and default locale behavior
 */
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

/**
 * Main middleware function that handles internationalization for all routes
 * Static file and Next.js internal route bypassing
 */
export function middleware(req: NextRequest) {
  const publicPatterns = [/\.(.*)$/];

  if (publicPatterns.some((pattern) => pattern.test(req.nextUrl.pathname))) {
    return;
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
