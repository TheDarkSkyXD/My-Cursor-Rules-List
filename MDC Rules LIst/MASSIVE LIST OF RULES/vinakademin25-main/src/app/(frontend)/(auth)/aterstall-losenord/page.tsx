'use client'
// Need Suspense for reading search parameters
import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

// Client component to read search params and pass token to the handler
function ResetPasswordClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  // Handle case where token is missing or invalid early
  if (!token) {
    return (
      <div className="text-center text-destructive p-6 rounded-md border border-destructive/20 bg-destructive/5">
        Ogiltig eller saknad token för lösenordsåterställning.
        <div className="mt-4">
          <a href="/glomt-losenord" className="underline underline-offset-4 hover:text-primary">
            Tillbaka till lösenordsåterställning
          </a>
        </div>
      </div>
    )
  }

  return <ResetPasswordForm token={token} />
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md">
            <Sparkles className="size-5 text-secondary" />
          </div>
          <span className="font-heading text-2xl">Vinakademin</span>
        </Link>
        <Suspense fallback={<div className="text-center p-4">Laddar...</div>}>
          <ResetPasswordClient />
        </Suspense>
      </div>
    </div>
  )
}
