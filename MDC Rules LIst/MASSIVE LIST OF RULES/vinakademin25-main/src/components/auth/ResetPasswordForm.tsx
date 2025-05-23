'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Schema for the reset form (Swedish messages)
const ResetSchema = z
  .object({
    password: z.string().min(8, { message: 'Lösenordet måste vara minst 8 tecken.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Lösenorden matchar inte',
    path: ['confirmPassword'],
  })

type ResetFormValues = z.infer<typeof ResetSchema>

// Simulate API call function (Swedish messages)
async function resetPassword(token: string): Promise<{ success: boolean; message: string }> {
  console.log('Återställer lösenord med token:', token)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Replace with actual backend call

  // Simulation:
  if (token === 'invalid-token') {
    return { success: false, message: 'Ogiltig eller utgången token för lösenordsåterställning.' }
  }
  return { success: true, message: 'Ditt lösenord har återställts.' }
}

interface ResetPasswordFormProps {
  token: string // The token from the URL
  className?: string
  [key: string]: any
}

export function ResetPasswordForm({ token, className, ...props }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(ResetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function onSubmit(values: ResetFormValues) {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const result = await resetPassword(token)
      if (result.success) {
        setSuccessMessage(result.message)
        form.reset()
      } else {
        setError(result.message) // Show error directly in the form
        // Optionally show a toast as well
        // toast({ title: "Fel", description: result.message, variant: "destructive" })
      }
    } catch (err) {
      console.error('Reset password error:', err)
      setError('Ett oväntat fel inträffade.')
      toast({ title: 'Fel', description: 'Ett oväntat fel inträffade.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Ange nytt lösenord</CardTitle>
          <CardDescription>Ange ditt nya lösenord nedan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <div className="grid gap-6">
                {!successMessage ? (
                  <>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <FormLabel>Nytt lösenord</FormLabel>
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
                          <FormLabel>Bekräfta nytt lösenord</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <Alert variant="default">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Klart!</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}
                {error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Fel</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {!successMessage ? (
                  <Button type="submit" variant={'default'} className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'Sparar...' : 'Spara nytt lösenord'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant={'default'}
                    className="w-full"
                    onClick={() => router.push('/logga-in')}
                  >
                    Fortsätt till inloggning
                  </Button>
                )}
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
