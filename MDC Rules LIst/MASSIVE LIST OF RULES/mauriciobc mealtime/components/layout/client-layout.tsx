"use client"

import React, { useEffect } from "react"
import dynamic from 'next/dynamic'
import { usePathname, useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import BottomNav from "@/components/bottom-nav"
import { AnimationProvider } from "@/components/animation-provider"
import { useUserContext } from "@/lib/context/UserContext"
import { GlobalLoading } from "@/components/ui/global-loading"

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

const OnboardingTour = dynamic(() => import("@/components/ui/onboarding-tour").then(mod => ({ default: mod.OnboardingTour })), {
  ssr: false,
  loading: () => null
})

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isAuthPage = pathname === "/login" || pathname === "/signup"

  const { state: { isLoading: profileLoading, currentUser }, authLoading } = useUserContext();

  // Handle redirection for authenticated users on auth pages
  useEffect(() => {
    if (!authLoading && !profileLoading && currentUser && isAuthPage) {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get("redirectTo") || "/";
      console.log("[ClientLayout] Authenticated user on auth page, redirecting to:", redirectTo);
      router.replace(redirectTo);
    }
  }, [authLoading, profileLoading, currentUser, isAuthPage, router, pathname]);

  // TEMP LOGGING
  if (typeof window !== "undefined") {
    console.log("[ClientLayout] pathname:", pathname, "authLoading:", authLoading, "profileLoading:", profileLoading, "currentUser:", currentUser);
  }

  if (authLoading || profileLoading) {
    if (typeof window !== "undefined") {
      console.log("[ClientLayout] Showing GlobalLoading spinner (authLoading or profileLoading is true)");
    }
    return <GlobalLoading mode="fullscreen" />;
  }

  const getHeaderProps = (): AppHeaderProps => {
    if (pathname === "/notifications") {
      return {
        title: "Notificações",
        showBackButton: true
      }
    }
    return {}
  }

  const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
    const { state } = useUserContext();
    const currentUser = state.currentUser;

    if (typeof window !== "undefined") {
      console.log("[ClientLayout] Rendering AuthenticatedLayout. currentUser:", currentUser);
    }

    return (
      <AnimationProvider>
        <div className="relative flex min-h-screen flex-col">
          <AppHeader {...getHeaderProps()} />
          <main className="flex-1 pb-16">
            {children}
          </main>
          <BottomNav />
          <OnboardingTour />
        </div>
      </AnimationProvider>
    );
  };

  if (isAuthPage) {
    if (typeof window !== "undefined") {
      console.log("[ClientLayout] Rendering AuthPage layout (login/signup)");
    }
    return (
       <div className="relative flex min-h-screen flex-col">
         <main className="flex-1">
           {children}
         </main>
       </div>
     );
  } else {
    if (typeof window !== "undefined") {
      console.log("[ClientLayout] Rendering AuthenticatedLayout wrapper");
    }
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }
} 