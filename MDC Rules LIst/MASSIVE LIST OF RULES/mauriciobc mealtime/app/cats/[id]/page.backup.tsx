import React, { Suspense } from "react"
import { notFound } from "next/navigation"
import CatDetails from "@/app/components/cat-details"
import { redirectionLogger } from "@/lib/monitoring/redirection-logger"
import { headers } from 'next/headers'

interface PageProps {
  params: { id: string };
}

export default async function CatPage({ params }: PageProps) {
  console.log("[CatPage] Starting page load", { 
    params,
    timestamp: new Date().toISOString()
  });

  // Get user ID from headers (set by middleware)
  const headersList = await headers();
  const userId = headersList.get('X-User-ID');
  
  console.log("[CatPage] Auth check", { 
    userId: userId ? "present" : "missing",
    timestamp: new Date().toISOString()
  });

  // Ensure params.id is properly awaited and validated
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  if (typeof id !== 'string' || !id) {
    console.error("[CatPage] Validation failed", { 
      params: resolvedParams,
      timestamp: new Date().toISOString()
    });
    redirectionLogger.logNotFoundRedirection(`/cats/${id}`, userId || undefined);
    notFound();
  }

  console.log("[CatPage] Validation passed, rendering CatDetails", {
    id,
    timestamp: new Date().toISOString()
  });
  
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CatDetails params={{ id }} />
    </Suspense>
  )
} 