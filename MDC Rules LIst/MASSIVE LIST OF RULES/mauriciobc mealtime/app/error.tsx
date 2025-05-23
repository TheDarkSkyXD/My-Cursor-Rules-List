'use client'

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FallbackProps } from 'react-error-boundary'

export default function ErrorPage({ error, resetErrorBoundary }: FallbackProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[ErrorPage]', {
      message: error.message,
      digest: 'digest' in error ? (error as any).digest : undefined,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado!</h1>
      <p className="text-gray-600 mb-6">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
} 