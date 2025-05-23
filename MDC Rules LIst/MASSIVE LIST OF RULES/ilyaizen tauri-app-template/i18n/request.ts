import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";
import { Locale } from "./settings";

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that the incoming locale is valid
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: "UTC",
  };
});

export const dynamic = "force-dynamic";
