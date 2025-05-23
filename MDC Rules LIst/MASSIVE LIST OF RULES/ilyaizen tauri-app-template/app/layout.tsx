import "./globals.css";

/**
 * Root layout that only imports global CSS and passes children through
 * The actual HTML structure is handled by src/app/[locale]/layout.tsx
 */

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
