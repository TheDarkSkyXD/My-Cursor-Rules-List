'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

// Assume User type is defined or imported
interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  bio?: string | null
}

interface ProfileDetailsFormProps {
  user: User
}

// Zod schema (Swedish messages)
const ProfileDetailsSchema = z.object({
  firstName: z.string().min(1, { message: 'Förnamn krävs.' }),
  lastName: z.string().min(1, { message: 'Efternamn krävs.' }),
  bio: z.string().max(200, { message: 'Biografin får inte överstiga 200 tecken.' }).optional(),
})

type ProfileDetailsFormValues = z.infer<typeof ProfileDetailsSchema>

// Simulate update function (Swedish messages)
async function updateProfileDetails(
  userId: string,
  data: ProfileDetailsFormValues,
): Promise<{ success: boolean; message: string }> {
  console.log('Uppdaterar profil för användare:', userId, data)
  await new Promise((resolve) => setTimeout(resolve, 1000))
  // Replace with actual API call
  return { success: true, message: 'Profilen uppdaterad!' }
}

export function ProfileDetailsForm({ user }: ProfileDetailsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<ProfileDetailsFormValues>({
    resolver: zodResolver(ProfileDetailsSchema),
    defaultValues: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      bio: user.bio || '',
    },
  })

  async function onSubmit(values: ProfileDetailsFormValues) {
    setIsLoading(true)
    try {
      const result = await updateProfileDetails(user.id, values)
      if (result.success) {
        toast({
          title: 'Klart',
          description: result.message,
        })
      } else {
        toast({
          title: 'Fel',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Update profile error:', err)
      toast({
        title: 'Fel',
        description: 'Ett oväntat fel inträffade när profilen skulle uppdateras.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Förnamn</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Efternamn</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Biografi</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Berätta lite om dig själv"
                  className="resize-none"
                  {...field}
                  value={field.value ?? ''}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Sparar...' : 'Spara ändringar'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
