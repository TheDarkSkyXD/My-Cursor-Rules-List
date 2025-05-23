"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/lib/context/LoadingContext";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface GlobalLoadingProps {
  mode?: 'progress' | 'spinner' | 'overlay';
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function GlobalLoading({ mode = 'progress', text, size = 'md' }: GlobalLoadingProps) {
  const { isLoading, state } = useLoading();
  const currentOperation = state.operations[0]; // Get highest priority operation
  const displayText = text || currentOperation?.description;

  if (!isLoading) return null;

  if (mode === 'overlay') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: 1,
                ease: "linear",
              }}
            >
              <Loader2 className={cn("text-primary", sizeClasses[size])} />
            </motion.div>
            {displayText && (
              <p className="text-sm text-muted-foreground">{displayText}</p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (mode === 'spinner') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 1,
              ease: "linear",
            }}
          >
            <Loader2 className={cn("text-primary", sizeClasses[size])} />
          </motion.div>
          {displayText && (
            <p className="ml-2 text-sm text-muted-foreground">{displayText}</p>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Default progress mode
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 pt-[56px]"
      >
        <Progress className="h-1" />
      </motion.div>
    </AnimatePresence>
  );
} 