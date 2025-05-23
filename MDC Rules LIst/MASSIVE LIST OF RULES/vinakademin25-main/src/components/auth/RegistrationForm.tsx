'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useAuth, RegisterUserData } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

// Define Zod schema for validation (Swedish messages)
const RegistrationSchema = z
  .object({
    firstName: z.string().min(1, { message: 'Förnamn krävs.' }),
    lastName: z.string().min(1, { message: 'Efternamn krävs.' }),
    email: z.string().email({ message: 'Ogiltig e-postadress.' }),
    password: z.string().min(8, { message: 'Lösenordet måste vara minst 8 tecken.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Lösenorden matchar inte',
    path: ['confirmPassword'],
  })

// Export the type so it can be used in AuthContext
export type RegistrationFormValues = z.infer<typeof RegistrationSchema>

export function RegistrationForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const { registerUser, isLoading } = useAuth()
  const router = useRouter()

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(RegistrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: RegistrationFormValues) {
    const apiData: RegisterUserData = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
    }

    const success = await registerUser(apiData)
    if (success) {
      // We need a dedicated page to show the VerifyEmailMessage component
      // Let's assume this page will be at /verifiera-epost-meddelande
      router.push('/verifiera-epost-meddelande')
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Skapa konto</CardTitle>
          <CardDescription>Ange dina uppgifter för att skapa ett konto</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormLabel>Förnamn</FormLabel>
                        <FormControl>
                          <Input placeholder="Max" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormLabel>Efternamn</FormLabel>
                        <FormControl>
                          <Input placeholder="Robinson" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel>E-post</FormLabel>
                      <FormControl>
                        <Input placeholder="namn@exempel.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel>Lösenord</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel>Bekräfta lösenord</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant={'default'} className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? 'Skapar konto...' : 'Skapa konto'}
                </Button>
              </div>
              <div className="text-center text-sm">
                Har du redan ett konto?{' '}
                <a href="/logga-in" className="underline underline-offset-4">
                  Logga in
                </a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        Genom att fortsätta, godkänner du våra <a href="/villkor">villkor</a> och{' '}
        <a href="/integritetspolicy">integritetspolicy</a>.
      </div>
    </div>
  )
}
