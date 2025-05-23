import { Locale } from "./settings";

/**
 * Get the messages for a specific locale.
 * This function is used server-side to load translations.
 */
export async function getMessages(locale: Locale) {
  try {
    // Import translation files dynamically based on locale
    const messages = await import(`../messages/${locale}.json`);
    return messages.default;
  } catch (error) {
    console.error(`Error loading messages for locale "${locale}":`, error);
    // Fallback to empty messages if translation file not found
    return {};
  }
}
