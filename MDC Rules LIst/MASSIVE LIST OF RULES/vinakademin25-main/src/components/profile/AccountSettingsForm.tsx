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
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail, Trash2, ShieldCheck } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'

// Assume User type includes email
interface User {
  id: string
  email: string
}

interface AccountSettingsFormProps {
  user: User
}

// --- Change Email ---
const ChangeEmailSchema = z.object({
  newEmail: z.string().email({ message: 'Ogiltig e-postadress.' }),
  currentPassword: z.string().min(1, { message: 'Nuvarande lösenord krävs.' }),
})
type ChangeEmailFormValues = z.infer<typeof ChangeEmailSchema>

// --- Change Password ---
const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Nuvarande lösenord krävs.' }),
    newPassword: z.string().min(8, { message: 'Nytt lösenord måste vara minst 8 tecken.' }),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Nya lösenorden matchar inte',
    path: ['confirmNewPassword'],
  })
type ChangePasswordFormValues = z.infer<typeof ChangePasswordSchema>

// --- Simulate API Calls ---
async function changeEmailApi(
  userId: string,
  data: ChangeEmailFormValues,
): Promise<{ success: boolean; message: string }> {
  console.log('Ändrar e-post för:', userId, data.newEmail)
  await new Promise((res) => setTimeout(res, 1000))
  // Replace with actual API call
  return {
    success: true,
    message: 'E-poständring påbörjad. Kontrollera din nya e-post för verifiering.',
  }
}

async function changePasswordApi(
  userId: string,
  data: ChangePasswordFormValues,
): Promise<{ success: boolean; message: string }> {
  console.log('Ändrar lösenord för:', userId)
  await new Promise((res) => setTimeout(res, 1000))
  // Replace with actual API call
  if (data.currentPassword !== 'password123') {
    // Simulate wrong current password
    return { success: false, message: 'Felaktigt nuvarande lösenord.' }
  }
  return { success: true, message: 'Lösenordet ändrat.' }
}

async function deleteAccountApi(userId: string): Promise<{ success: boolean; message: string }> {
  console.log('Tar bort konto för:', userId)
  await new Promise((res) => setTimeout(res, 1000))
  // Replace with actual API call
  return { success: true, message: 'Kontot borttaget.' }
  // On success, likely need to redirect user / clear session
}
// --- End Simulate API Calls ---

export function AccountSettingsForm({ user }: AccountSettingsFormProps) {
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const { toast } = useToast()

  const emailForm = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(ChangeEmailSchema),
    defaultValues: { newEmail: '', currentPassword: '' },
  })

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  })

  async function handleChangeEmail(values: ChangeEmailFormValues) {
    setIsEmailLoading(true)
    try {
      const result = await changeEmailApi(user.id, values)
      toast({
        title: result.success ? 'Klart' : 'Fel',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })
      if (result.success) emailForm.reset()
    } catch (err) {
      toast({ title: 'Fel', description: 'Kunde inte uppdatera e-post.', variant: 'destructive' })
      console.error('Change email error:', err)
    } finally {
      setIsEmailLoading(false)
    }
  }

  async function handleChangePassword(values: ChangePasswordFormValues) {
    setIsPasswordLoading(true)
    try {
      const result = await changePasswordApi(user.id, values)
      toast({
        title: result.success ? 'Klart' : 'Fel',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })
      if (result.success) passwordForm.reset()
    } catch (err) {
      toast({ title: 'Fel', description: 'Kunde inte uppdatera lösenord.', variant: 'destructive' })
      console.error('Change password error:', err)
    } finally {
      setIsPasswordLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setIsDeleteLoading(true)
    try {
      const result = await deleteAccountApi(user.id)
      toast({
        title: result.success ? 'Klart' : 'Fel',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })
      // Handle redirection / logout on success
      if (result.success) {
        // Example: Redirect to homepage after successful deletion
        // router.push('/');
      }
    } catch (err) {
      console.error('Delete account error:', err)
      toast({ title: 'Fel', description: 'Kunde inte ta bort kontot.', variant: 'destructive' })
    } finally {
      setIsDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Change Email Form */}
      <section>
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Ändra E-post
        </h3>
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(handleChangeEmail)} className="space-y-4 max-w-md">
            <p className="text-sm text-muted-foreground">Nuvarande e-post: {user.email}</p>
            <FormField
              name="newEmail"
              control={emailForm.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ny E-postadress</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="ny.epost@exempel.com"
                      {...field}
                      disabled={isEmailLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="currentPassword"
              control={emailForm.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bekräfta med nuvarande lösenord</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} disabled={isEmailLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isEmailLoading}>
              {isEmailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEmailLoading ? 'Uppdaterar...' : 'Uppdatera E-post'}
            </Button>
          </form>
        </Form>
      </section>

      <Separator />

      {/* Change Password Form */}
      <section>
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <ShieldCheck className="mr-2 h-5 w-5" />
          Ändra Lösenord
        </h3>
        <Form {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit(handleChangePassword)}
            className="space-y-4 max-w-md"
          >
            <FormField
              name="currentPassword"
              control={passwordForm.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuvarande Lösenord</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} disabled={isPasswordLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="newPassword"
              control={passwordForm.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nytt Lösenord</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} disabled={isPasswordLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="confirmNewPassword"
              control={passwordForm.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bekräfta Nytt Lösenord</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} disabled={isPasswordLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPasswordLoading}>
              {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPasswordLoading ? 'Uppdaterar...' : 'Uppdatera Lösenord'}
            </Button>
          </form>
        </Form>
      </section>

      <Separator />

      {/* Delete Account Section */}
      <section>
        <h3 className="text-lg font-medium mb-2 flex items-center text-destructive">
          <Trash2 className="mr-2 h-5 w-5" />
          Ta bort konto
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ta bort ditt konto och all tillhörande data permanent. Denna åtgärd kan inte ångras.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleteLoading}>
              {isDeleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Ta bort mitt
              konto
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Är du helt säker?</AlertDialogTitle>
              <AlertDialogDescription>
                Denna åtgärd kan inte ångras. Detta kommer permanent att ta bort ditt konto och
                radera din data från våra servrar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Ja, ta bort kontot
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  )
}
