'use client'

import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function CatError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[CatError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h2 className="text-2xl font-semibold">Algo deu errado</h2>
      <p className="text-muted-foreground text-center max-w-[500px]">
        Ocorreu um erro ao carregar os dados do gato. Por favor, tente novamente.
      </p>
      <Button onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  )
} 