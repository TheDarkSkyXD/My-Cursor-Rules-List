'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Loader2, BookOpenIcon, SettingsIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleBasedContent from '@/components/dashboard/RoleBasedContent'

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}

function DashboardContent() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Laddar din profil...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl mb-4">Du måste vara inloggad för att se denna sida</p>
        <Link href="/login">
          <Button>Logga in</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-3xl font-heading font-bold mb-8">Mina Sidor</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Min Profil</CardTitle>
          <CardDescription>Din personliga information och kontaktuppgifter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-muted">
              {user.avatar &&
              typeof user.avatar === 'object' &&
              user.avatar !== null &&
              'url' in user.avatar ? (
                <AvatarImage src={user.avatar.url || ''} alt={user.firstName || 'Avatar'} />
              ) : (
                <AvatarFallback className="bg-secondary/10 text-secondary">
                  {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user.firstName || 'Användare'}</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpenIcon className="mr-2 h-5 w-5 text-secondary" />
              Mina kurser
            </CardTitle>
            <CardDescription>Se vilka kurser du är anmäld till</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/mina-sidor/kurser">
              <Button className="w-full">Visa mina kurser</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="mr-2 h-5 w-5 text-secondary" />
              Profilinställningar
            </CardTitle>
            <CardDescription>Uppdatera dina uppgifter</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/mina-sidor/inställningar">
              <Button className="w-full">Hantera profil</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <RoleBasedContent user={user} />
    </div>
  )
}
