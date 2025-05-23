"use client";

import { GlobalLoading } from "@/components/ui/global-loading";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
}

export default function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  return <GlobalLoading mode="spinner" size={size} />;
} 