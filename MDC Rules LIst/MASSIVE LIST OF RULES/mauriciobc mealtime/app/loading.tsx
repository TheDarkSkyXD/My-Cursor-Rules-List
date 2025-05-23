"use client";

import { GlobalLoading } from "@/components/ui/global-loading";

export default function Loading() {
  return <GlobalLoading mode="overlay" text="Carregando..." />;
}

