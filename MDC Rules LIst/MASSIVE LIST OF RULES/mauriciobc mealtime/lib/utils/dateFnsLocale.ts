import { ptBR, enUS } from "date-fns/locale";
import type { Locale } from "date-fns";

const localeMap: Record<string, Locale> = {
  "pt-BR": ptBR,
  "en-US": enUS,
  // Add more locales as needed
};

export function resolveDateFnsLocale(language: string | undefined): Locale {
  return localeMap[language ?? "pt-BR"] || ptBR;
} 