"use client";

import { IntlProvider } from "@/components/intl-provider";
import { AbstractIntlMessages } from "next-intl";
import { ThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";

/**
 * Root providers component that wraps the application with necessary context providers:
 * - Internationalization (next-intl)
 * - Theme Management (next-themes)
 */

/**
 * Props for the Providers component
 */
interface ProvidersProps extends PropsWithChildren {
  locale: string; // Current language/locale code
  messages: AbstractIntlMessages; // Translation messages for the current locale
}

/**
 * Providers component that establishes the context hierarchy:
 * 1. IntlProvider - Handles translations and localization
 * 2. ThemeProvider - Manages light/dark theme preferences
 */
export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <IntlProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </IntlProvider>
  );
}
