import { UserProfilePage } from '@/components/profile/UserProfilePage'
import React from 'react'

// This page will be protected by middleware

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8">
      {/* TODO: Add checks for loading/error state from useAuth if needed before rendering */}
      <UserProfilePage />
    </div>
  )
}
