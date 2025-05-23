/**
 * Available color themes for calendars and habits.
 * Each color has a key for translation and a Tailwind background class.
 */
export const COLOR_VALUES = [
  { key: "red", value: "bg-red-500" },
  { key: "orange", value: "bg-orange-500" },
  { key: "amber", value: "bg-amber-500" },
  { key: "yellow", value: "bg-yellow-500" },
  { key: "lime", value: "bg-lime-500" },
  { key: "green", value: "bg-green-500" },
  { key: "emerald", value: "bg-emerald-500" },
  { key: "teal", value: "bg-teal-500" },
  { key: "cyan", value: "bg-cyan-500" },
  { key: "sky", value: "bg-sky-500" },
  { key: "blue", value: "bg-blue-500" },
  { key: "indigo", value: "bg-indigo-500" },
  { key: "violet", value: "bg-violet-500" },
  { key: "purple", value: "bg-purple-500" },
  { key: "fuchsia", value: "bg-fuchsia-500" },
  { key: "pink", value: "bg-pink-500" },
  { key: "rose", value: "bg-rose-500" },
] as const;

/**
 * Color system for habit completion visualization.
 * Each color has 3 intensity levels using opacity.
 * The intensity increases with the completion count:
 * - Level 1 (count = 1): 50% opacity
 * - Level 2 (count = 2): 75% opacity
 * - Level 3 (count ≥ 3): 100% opacity
 */
const COLOR_LEVELS = {
  red: {
    1: "fill-red-500/50 dark:fill-red-500/50",
    2: "fill-red-500/75 dark:fill-red-500/75",
    3: "fill-red-500 dark:fill-red-500",
  },
  orange: {
    1: "fill-orange-500/50 dark:fill-orange-500/50",
    2: "fill-orange-500/75 dark:fill-orange-500/75",
    3: "fill-orange-500 dark:fill-orange-500",
  },
  amber: {
    1: "fill-amber-500/50 dark:fill-amber-500/50",
    2: "fill-amber-500/75 dark:fill-amber-500/75",
    3: "fill-amber-500 dark:fill-amber-500",
  },
  yellow: {
    1: "fill-yellow-500/50 dark:fill-yellow-500/50",
    2: "fill-yellow-500/75 dark:fill-yellow-500/75",
    3: "fill-yellow-500 dark:fill-yellow-500",
  },
  lime: {
    1: "fill-lime-500/50 dark:fill-lime-500/50",
    2: "fill-lime-500/75 dark:fill-lime-500/75",
    3: "fill-lime-500 dark:fill-lime-500",
  },
  green: {
    1: "fill-green-500/50 dark:fill-green-500/50",
    2: "fill-green-500/75 dark:fill-green-500/75",
    3: "fill-green-500 dark:fill-green-500",
  },
  emerald: {
    1: "fill-emerald-500/50 dark:fill-emerald-500/50",
    2: "fill-emerald-500/75 dark:fill-emerald-500/75",
    3: "fill-emerald-500 dark:fill-emerald-500",
  },
  teal: {
    1: "fill-teal-500/50 dark:fill-teal-500/50",
    2: "fill-teal-500/75 dark:fill-teal-500/75",
    3: "fill-teal-500 dark:fill-teal-500",
  },
  cyan: {
    1: "fill-cyan-500/50 dark:fill-cyan-500/50",
    2: "fill-cyan-500/75 dark:fill-cyan-500/75",
    3: "fill-cyan-500 dark:fill-cyan-500",
  },
  sky: {
    1: "fill-sky-500/50 dark:fill-sky-500/50",
    2: "fill-sky-500/75 dark:fill-sky-500/75",
    3: "fill-sky-500 dark:fill-sky-500",
  },
  blue: {
    1: "fill-blue-500/50 dark:fill-blue-500/50",
    2: "fill-blue-500/75 dark:fill-blue-500/75",
    3: "fill-blue-500 dark:fill-blue-500",
  },
  indigo: {
    1: "fill-indigo-500/50 dark:fill-indigo-500/50",
    2: "fill-indigo-500/75 dark:fill-indigo-500/75",
    3: "fill-indigo-500 dark:fill-indigo-500",
  },
  violet: {
    1: "fill-violet-500/50 dark:fill-violet-500/50",
    2: "fill-violet-500/75 dark:fill-violet-500/75",
    3: "fill-violet-500 dark:fill-violet-500",
  },
  purple: {
    1: "fill-purple-500/50 dark:fill-purple-500/50",
    2: "fill-purple-500/75 dark:fill-purple-500/75",
    3: "fill-purple-500 dark:fill-purple-500",
  },
  fuchsia: {
    1: "fill-fuchsia-500/50 dark:fill-fuchsia-500/50",
    2: "fill-fuchsia-500/75 dark:fill-fuchsia-500/75",
    3: "fill-fuchsia-500 dark:fill-fuchsia-500",
  },
  pink: {
    1: "fill-pink-500/50 dark:fill-pink-500/50",
    2: "fill-pink-500/75 dark:fill-pink-500/75",
    3: "fill-pink-500 dark:fill-pink-500",
  },
  rose: {
    1: "fill-rose-500/50 dark:fill-rose-500/50",
    2: "fill-rose-500/75 dark:fill-rose-500/75",
    3: "fill-rose-500 dark:fill-rose-500",
  },
};

/**
 * Gets the fill color class for SVG elements based on completion count.
 * The color intensity increases with the completion count using opacity levels.
 *
 * @param colorTheme - The base color theme (e.g., "bg-red-500")
 * @param count - Number of completions for this date
 * @returns A Tailwind CSS fill color class
 *
 * Examples:
 * - count = 0 -> "" (empty state)
 * - count = 1 -> "fill-{color}-500/50" (50% opacity)
 * - count = 2 -> "fill-{color}-500/75" (75% opacity)
 * - count ≥ 3 -> "fill-{color}-500" (100% opacity)
 */
export function getCompletionColorClass(colorTheme: string, count: number): string {
  if (count === 0) return "";

  // Extract color name from theme (e.g., "bg-red-500" -> "red")
  const colorMatch = colorTheme.match(/bg-(\w+)-\d+/);
  if (!colorMatch) {
    console.warn("Invalid color theme format:", colorTheme);
    return "";
  }

  const colorName = colorMatch[1];
  if (!(colorName in COLOR_LEVELS)) {
    console.warn("Color not found in COLOR_LEVELS:", colorName);
    return "";
  }

  // Map completion count to color intensity level (1-3)
  let level: 1 | 2 | 3;
  if (count >= 3) {
    level = 3;
  } else if (count === 2) {
    level = 2;
  } else {
    level = 1;
  }

  return COLOR_LEVELS[colorName as keyof typeof COLOR_LEVELS][level];
}

/**
 * Gets the background color class for calendar cells based on completion count.
 * Similar to getCompletionColorClass but for background colors instead of SVG fills.
 */
export function getBackgroundColorClass(colorTheme: string, count: number): string {
  if (count === 0) return "";

  const colorMatch = colorTheme.match(/bg-(\w+)-\d+/);
  if (!colorMatch) {
    console.warn("Invalid color theme format:", colorTheme);
    return "";
  }

  const colorName = colorMatch[1];
  const baseClass = `bg-${colorName}-500`;

  if (count >= 3) return baseClass;
  if (count === 2) return `${baseClass}/75`;
  return `${baseClass}/50`;
}

/**
 * RGB values for each color shade in our theme
 */
export const RGB_SHADES = {
  red: {
    300: "252 165 165",
    400: "248 113 113",
    500: "239 68 68",
    600: "220 38 38",
  },
  orange: {
    300: "253 186 116",
    400: "251 146 60",
    500: "249 115 22",
    600: "234 88 12",
  },
  amber: {
    300: "252 211 77",
    400: "251 191 36",
    500: "245 158 11",
    600: "217 119 6",
  },
  yellow: {
    300: "253 224 71",
    400: "250 204 21",
    500: "234 179 8",
    600: "202 138 4",
  },
  lime: {
    300: "190 242 100",
    400: "163 230 53",
    500: "132 204 22",
    600: "101 163 13",
  },
  green: {
    300: "134 239 172",
    400: "74 222 128",
    500: "34 197 94",
    600: "22 163 74",
  },
  emerald: {
    300: "110 231 183",
    400: "52 211 153",
    500: "16 185 129",
    600: "5 150 105",
  },
  teal: {
    300: "94 234 212",
    400: "45 212 191",
    500: "20 184 166",
    600: "13 148 136",
  },
  cyan: {
    300: "103 232 249",
    400: "34 211 238",
    500: "6 182 212",
    600: "8 145 178",
  },
  sky: {
    300: "125 211 252",
    400: "56 189 248",
    500: "14 165 233",
    600: "2 132 199",
  },
  blue: {
    300: "147 197 253",
    400: "96 165 250",
    500: "59 130 246",
    600: "37 99 235",
  },
  indigo: {
    300: "165 180 252",
    400: "129 140 248",
    500: "99 102 241",
    600: "79 70 229",
  },
  violet: {
    300: "196 181 253",
    400: "167 139 250",
    500: "139 92 246",
    600: "124 58 237",
  },
  purple: {
    300: "216 180 254",
    400: "192 132 252",
    500: "168 85 247",
    600: "147 51 234",
  },
  fuchsia: {
    300: "240 171 252",
    400: "232 121 249",
    500: "217 70 239",
    600: "192 38 211",
  },
  pink: {
    300: "249 168 212",
    400: "244 114 182",
    500: "236 72 153",
    600: "219 39 119",
  },
  rose: {
    300: "253 164 175",
    400: "251 113 133",
    500: "244 63 94",
    600: "225 29 72",
  },
} as const;

/**
 * Gets RGB values for charts based on color theme and shade
 * @param colorTheme - The base color theme (e.g., "bg-red-500")
 * @param shade - The color shade (300-600)
 * @returns RGB values string (e.g., "239 68 68")
 */
export function getChartRGBValues(colorTheme: string, shade: 300 | 400 | 500 | 600 = 500): string {
  const colorMatch = colorTheme.match(/bg-(\w+)-\d+/);
  const colorName = colorMatch ? colorMatch[1] : "purple";
  return RGB_SHADES[colorName as keyof typeof RGB_SHADES][shade];
}

/**
 * Generates RGB color values with opacity levels for activity calendar
 */
export function getActivityCalendarTheme(colorTheme: string): { light: string[]; dark: string[] } {
  const colorMatch = colorTheme.match(/bg-(\w+)-\d+/);
  if (!colorMatch) {
    console.warn("Invalid color theme format:", colorTheme);
    return {
      light: [
        "rgb(124 124 124 / 0.1)",
        "rgb(239 68 68 / 0.3)",
        "rgb(239 68 68 / 0.5)",
        "rgb(239 68 68 / 0.7)",
        "rgb(239 68 68 / 0.85)",
      ],
      dark: [
        "rgb(124 124 124 / 0.1)",
        "rgb(239 68 68 / 0.3)",
        "rgb(239 68 68 / 0.5)",
        "rgb(239 68 68 / 0.7)",
        "rgb(239 68 68 / 0.85)",
      ],
    };
  }

  const colorName = colorMatch[1] as keyof typeof RGB_SHADES;
  const rgb = RGB_SHADES[colorName][500];

  const theme = [
    "rgb(124 124 124 / 0.1)", // Empty state stays gray
    `rgb(${rgb} / 0.3)`,
    `rgb(${rgb} / 0.5)`,
    `rgb(${rgb} / 0.7)`,
    `rgb(${rgb} / 0.85)`,
  ];

  return {
    light: theme,
    dark: theme,
  };
}
