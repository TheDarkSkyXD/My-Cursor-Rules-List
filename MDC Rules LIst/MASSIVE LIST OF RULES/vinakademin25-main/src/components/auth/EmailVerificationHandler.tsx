'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // Or next/link for navigation
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EmailVerificationHandlerProps {
  token: string | null | undefined
}

export function EmailVerificationHandler({ token }: EmailVerificationHandlerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast() // Added toast for better feedback

  useEffect(() => {
    const handleVerification = async () => {
      if (!token) {
        setError('Ingen verifieringstoken angiven.') // Swedish
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      setSuccessMessage(null)

      try {
        // Make the actual API call to Payload's verification endpoint
        const response = await fetch(`/api/users/verify/${token}`, {
          method: 'POST',
          headers: {
            // No Content-Type needed for POST without body usually
            // Add Authorization header if required by your setup, though unlikely for verify
          },
          // No body needed for this specific Payload endpoint
        })

        if (response.ok) {
          // Consider parsing response JSON if backend sends specific success messages
          // const data = await response.json();
          // setSuccessMessage(data.message || 'E-postadressen har verifierats!');
          setSuccessMessage('E-postadressen har verifierats! Du kan nu logga in.') // Generic success
        } else {
          let errorMessage = 'Ogiltig eller utgången verifieringstoken.' // Default error
          try {
            const errorData = await response.json()
            errorMessage = errorData.errors?.[0]?.message || errorData.message || errorMessage
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError)
          }
          setError(errorMessage)
          toast({
            title: 'Verifiering misslyckades',
            description: errorMessage,
            variant: 'destructive',
          })
        }
      } catch (err) {
        console.error('Verifieringsfel:', err)
        const errorMessage = 'Ett oväntat nätverksfel inträffade vid verifiering.'
        setError(errorMessage)
        toast({ title: 'Verifieringsfel', description: errorMessage, variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }

    handleVerification()
  }, [token, toast]) // Added toast to dependency array

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">E-postverifiering</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Verifierar din e-post...</p>
          </div>
        )}

        {/* Display error within the card if it's not just a toast */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Verifiering misslyckades</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            {/* Optionally add a button to go back or request new link */}
          </Alert>
        )}

        {successMessage && !isLoading && (
          <div className="space-y-4">
            <Alert variant="default">
              {' '}
              {/* Using default variant */}
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Klart!</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
            <Button
              className="w-full"
              onClick={() => router.push('/logga-in')} // Use Swedish path
            >
              Fortsätt till inloggning
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
