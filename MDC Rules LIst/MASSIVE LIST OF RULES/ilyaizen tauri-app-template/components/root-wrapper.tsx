"use client";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { MotionWrapper } from "@/components/motion-wrapper";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "next-themes";

/**
 * Root application wrapper component that provides core functionality:
 * - Theme management with system preference support
 * - Page transition animations
 * - Consistent layout structure
 */

/**
 * Props interface for the RootWrapper component
 */
interface RootWrapperProps {
  /** Application content to be wrapped */
  children: React.ReactNode;
}

/**
 * Root wrapper component that provides application-wide functionality.
 * Handles theme management, animations, and layout structure.
 * Includes header, footer, and toast notifications.
 */
export function RootWrapper({ children }: RootWrapperProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen w-full flex-col">
        {/* Application header with navigation */}
        <AppHeader />

        {/* Main content with page transition animations */}
        <AnimatePresence mode="wait">
          <MotionWrapper>{children}</MotionWrapper>
        </AnimatePresence>

        {/* Application footer with credits and language switcher */}
        <AppFooter />
      </div>
    </ThemeProvider>
  );
}
