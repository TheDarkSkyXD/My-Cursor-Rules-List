"use client";

import { GlobalLoading } from "./global-loading";

interface LoadingProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loading({ text, size = "md", className }: LoadingProps) {
  return (
    <GlobalLoading 
      mode="spinner" 
      text={text} 
      size={size}
    />
  );
} 