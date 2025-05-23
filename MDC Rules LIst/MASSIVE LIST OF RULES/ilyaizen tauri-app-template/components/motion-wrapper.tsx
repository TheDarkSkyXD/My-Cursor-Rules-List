"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Page transition animation wrapper using Framer Motion.
 * Provides smooth fade and slide animations when navigating between pages.
 * Uses pathname as key to trigger animations on route changes.
 */

/**
 * Props interface for the MotionWrapper component
 */
interface MotionWrapperProps {
  /** Content to be animated during page transitions */
  children: React.ReactNode;
}

/**
 * Wraps page content with Framer Motion animations.
 * Animates opacity and vertical position on route changes.
 * Uses a custom easing curve for smooth transitions.
 */
export function MotionWrapper({ children }: MotionWrapperProps) {
  // Get current pathname to trigger animations on route changes
  const pathname = usePathname();

  return (
    <motion.main
      key={pathname}
      className="flex-1"
      // Initial state when component mounts
      initial={{ opacity: 0, y: 20 }}
      // Animated state after mounting
      animate={{ opacity: 1, y: 0 }}
      // State when component unmounts
      exit={{ opacity: 0, y: -20 }}
      // Animation configuration
      transition={{ duration: 1, ease: [0, 0.7, 0.1, 1] }}
    >
      {children}
    </motion.main>
  );
}
