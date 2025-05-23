'use client'

import React from 'react'
import { MailCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button' // Optional: For resend logic
import { cn } from '@/lib/utils'

interface VerifyEmailMessageProps {
  email?: string | null // Make email optional
  onResend?: () => void // Optional callback for resend button
  className?: string
  [key: string]: any
}

export function VerifyEmailMessage({
  email,
  onResend,
  className,
  ...props
}: VerifyEmailMessageProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Verifiera din e-post</CardTitle>
          <CardDescription>
            Vi behöver bekräfta din e-postadress för att slutföra din registrering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <Alert>
              <MailCheck className="h-4 w-4" />
              <AlertTitle>Kontrollera din inkorg!</AlertTitle>
              <AlertDescription>
                {email ? (
                  <>
                    Vi har skickat en verifieringslänk till <strong>{email}</strong>. Vänligen
                    klicka på länken i e-postmeddelandet för att aktivera ditt konto.
                  </>
                ) : (
                  <>
                    Vi har skickat en verifieringslänk till den e-postadress du angav. Vänligen
                    klicka på länken i e-postmeddelandet för att aktivera ditt konto.
                  </>
                )}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Fick du inget e-post? Kontrollera din skräppostmapp eller vänta några minuter. Länken
              är giltig i 2 timmar.
            </p>
            {onResend && (
              <Button
                variant="outline"
                className="w-full"
                onClick={onResend}
                // TODO: Add loading state for resend if needed
              >
                Skicka verifieringslänk igen
              </Button>
            )}
            <div className="text-center text-sm">
              <a href="/logga-in" className="underline underline-offset-4 hover:text-primary">
                Tillbaka till inloggning
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        Genom att fortsätta, godkänner du våra <a href="/villkor">villkor</a> och{' '}
        <a href="/integritetspolicy">integritetspolicy</a>.
      </div>
    </div>
  )
}
