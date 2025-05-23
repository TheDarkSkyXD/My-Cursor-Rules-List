'use client'

import React, { useState } from 'react'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, MailCheck, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Schema for the request form (Swedish messages)
const RequestSchema = z.object({
  email: z.string().email({ message: 'Ange en giltig e-postadress.' }),
})

type RequestFormValues = z.infer<typeof RequestSchema>

// Simulate API call function (Swedish messages)
async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  console.log('Begär lösenordsåterställning för:', email)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Replace with actual backend call

  // Simulation:
  if (email === 'error@example.com') {
    return { success: false, message: 'Kunde inte skicka återställningslänk. Försök igen.' }
  }
  return {
    success: true,
    message: 'Om ett konto finns för denna e-post har en återställningslänk skickats.',
  }
}

export function RequestPasswordResetForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { toast } = useToast()

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(RequestSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: RequestFormValues) {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const result = await requestPasswordReset(values.email)
      if (result.success) {
        setSuccessMessage(result.message) // Display success message directly in the form
        form.reset()
      } else {
        setError(result.message) // Display error message directly
      }
    } catch (err) {
      console.error('Request reset error:', err)
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
          <CardTitle className="text-xl">Återställ lösenord</CardTitle>
          <CardDescription>
            Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <div className="grid gap-6">
                {successMessage ? (
                  <Alert variant="default">
                    <MailCheck className="h-4 w-4" />
                    <AlertTitle>Kontrollera din e-post</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                ) : (
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
                )}
                {error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Fel</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {!successMessage && (
                  <Button type="submit" variant={'default'} className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'Skickar...' : 'Skicka återställningslänk'}
                  </Button>
                )}
              </div>
              <div className="text-center text-sm">
                Kom du ihåg ditt lösenord?{' '}
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
