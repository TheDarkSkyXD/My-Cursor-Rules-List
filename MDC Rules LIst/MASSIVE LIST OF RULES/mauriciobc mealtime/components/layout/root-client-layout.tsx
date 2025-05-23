"use client"

import React from "react"
// Removed imports start
// import dynamic from 'next/dynamic'
// import { NotificationProvider } from "@/lib/context/NotificationContext"
// import { SessionProvider } from "@/components/auth/session-provider"
// import { Toaster } from "sonner"
// import NotificationChecker from "@/components/notifications/notification-checker"
// import { UserProvider } from "@/lib/context/UserContext"
// import { ScheduleProvider } from "@/lib/context/ScheduleContext"
// import { AnimationProvider } from "@/components/animation-provider"
import { ClientLayout } from "@/components/layout/client-layout"
import { LoadingProvider } from "@/lib/context/LoadingContext"
import { GlobalLoading } from "@/components/ui/global-loading"
// import { HouseholdProvider } from "@/lib/context/HouseholdContext"
// import { CatsProvider } from "@/lib/context/CatsContext"
// import { FeedingProvider } from "@/lib/context/FeedingContext"
// import { AppProvider } from "@/lib/context/AppContext"
import { ThemeProvider } from "@/components/theme-provider"
import { UserProvider } from "@/lib/context/UserContext"
import { NotificationProvider } from "@/lib/context/NotificationContext"
import { HouseholdProvider } from "@/lib/context/HouseholdContext"
import { CatsProvider } from "@/lib/context/CatsContext"
import { FeedingProvider } from "@/lib/context/FeedingContext"
import { ScheduleProvider } from "@/lib/context/ScheduleContext"
import { Toaster } from "@/components/ui/sonner"
import { ReactQueryProvider } from "@/lib/providers/react-query-provider"
import { useReportWebVitals } from "next/web-vitals"
import { ErrorProvider, ErrorBoundary } from "@/lib/context/ErrorContext"
// Removed AuthGuard import

// Removed dynamic import
// const OnboardingTour = dynamic(() => import("@/components/ui/onboarding-tour").then(mod => ({ default: mod.OnboardingTour })), {
//   ssr: false,
//   loading: () => null
// })

export function RootClientLayout({ children }: { children: React.ReactNode }) {
  useReportWebVitals((metric) => {
    // console.log(metric); // Log web vitals if needed
  });

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ReactQueryProvider>
        <ErrorProvider>
          <ErrorBoundary>
            <LoadingProvider>
              <UserProvider>
                <HouseholdProvider>
                  <CatsProvider>
                    <FeedingProvider>
                      <ScheduleProvider>
                        <NotificationProvider>
                          <ClientLayout>
                            {children}
                          </ClientLayout>
                          <Toaster richColors position="top-center" />
                          <GlobalLoading />
                        </NotificationProvider>
                      </ScheduleProvider>
                    </FeedingProvider>
                  </CatsProvider>
                </HouseholdProvider>
              </UserProvider>
            </LoadingProvider>
          </ErrorBoundary>
        </ErrorProvider>
      </ReactQueryProvider>
    </ThemeProvider>
  )
} 