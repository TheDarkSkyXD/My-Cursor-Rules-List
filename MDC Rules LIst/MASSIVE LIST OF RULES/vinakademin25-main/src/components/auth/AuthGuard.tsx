'use client'

import React, { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, error } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!isLoading && !user) {
      console.log('AuthGuard: No user found after loading, redirecting to login.')
      router.push('/logga-in')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Kontrollerar behörighet...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">Autentiseringsfel: {error}</p>
      </div>
    )
  }

  if (!isLoading && user) {
    return <>{children}</>
  }

  return null
}
