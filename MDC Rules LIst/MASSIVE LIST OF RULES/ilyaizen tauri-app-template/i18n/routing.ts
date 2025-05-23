import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "he"],
  // locales: ["de", "en", "es", "fr", "ru", "he", "ar", "hi", "zh"],
  defaultLocale: "en",
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
