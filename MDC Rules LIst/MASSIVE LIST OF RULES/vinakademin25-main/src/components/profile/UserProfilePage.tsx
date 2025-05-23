'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// Import the sub-components
import { ProfileDetailsForm } from './ProfileDetailsForm'
import { AccountSettingsForm } from './AccountSettingsForm'
import { ProfileAvatarUpload } from './ProfileAvatarUpload'

// TODO: Fetch real user data. Define a proper User type based on your Payload collection.
interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  bio?: string | null
  avatarUrl?: string | null // Assuming the user object might have an avatar URL
  // Add other relevant fields from your User collection
}

// interface UserProfilePageProps {
//   userData: User;
// }

export function UserProfilePage(/* { userData } */) {
  // Placeholder data - replace with actual fetched user data
  // const { user, loading, error } = useAuth(); // Example using a hypothetical auth hook
  const [user, setUser] = React.useState<User>({
    id: '123',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    bio: 'Utforskar vinets värld, en druva i taget.', // Swedish
    avatarUrl: null, // Example: 'https://github.com/shadcn.png'
  })

  // Callback for successful avatar upload to update local state
  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setUser((prevUser) => ({ ...prevUser, avatarUrl: newAvatarUrl }))
  }

  // TODO: Add loading and error states based on data fetching
  // if (loading) return <p>Loading profile...</p>;
  // if (error) return <p>Error loading profile: {error}</p>;
  // if (!user) return <p>Please log in to view your profile.</p>;

  return (
    <Card className="w-full max-w-3xl mx-auto mt-6 mb-6">
      <CardHeader>
        <CardTitle className="text-2xl">Din Profil</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Profiluppgifter</TabsTrigger>
            <TabsTrigger value="avatar">Profilbild</TabsTrigger>
            <TabsTrigger value="settings">Kontoinställningar</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Personlig Information</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileDetailsForm user={user} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="avatar" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Profilbild</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileAvatarUpload
                  userId={user.id}
                  currentAvatarUrl={user.avatarUrl}
                  userName={`${user.firstName} ${user.lastName}`}
                  onUploadSuccess={handleAvatarUpdate}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Kontohantering</CardTitle>
              </CardHeader>
              <CardContent>
                <AccountSettingsForm user={user} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
