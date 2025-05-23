import { createClient } from '@/utils/supabase/server';
import { GlobalLoading } from '@/components/ui/global-loading';
import { Suspense } from 'react';
import { GlobalLoading as ServerGlobalLoading } from "@/components/ui/global-loading";
import { notFound } from 'next/navigation';

export default async function CatPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient();
  const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !supabaseUser) {
    console.error("CatPageLayout: Unauthorized access attempt.");
    notFound();
  }

  return (
    <Suspense fallback={<GlobalLoading mode="overlay" text="Carregando..." />}>
      {children}
    </Suspense>
  );
} 