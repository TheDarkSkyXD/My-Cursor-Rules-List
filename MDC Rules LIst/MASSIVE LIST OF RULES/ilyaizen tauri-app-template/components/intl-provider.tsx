"use client";

import { AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { PropsWithChildren } from "react";

/**
 * Client-side internationalization provider component using next-intl.
 * Wraps the application to provide localization support with timezone handling.
 * Includes error handling for missing translations.
 */

/**
 * Props interface for the IntlProvider component
 */
interface IntlProviderProps extends PropsWithChildren {
  /** Locale code for the current language (e.g., 'en', 'fr', 'ar') */
  locale: string;
  /** Translation messages object containing key-value pairs for the current locale */
  messages: AbstractIntlMessages;
  /** Optional timezone for date/time formatting, defaults to UTC */
  timeZone?: string;
}

/**
 * Wraps the application with next-intl's provider for client-side translations.
 * Handles timezone-aware date formatting and translation error logging.
 */
export function IntlProvider({ children, locale, messages, timeZone = "UTC" }: IntlProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
      onError={(error) => {
        // Log translation errors to console for debugging
        console.error(error);
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
