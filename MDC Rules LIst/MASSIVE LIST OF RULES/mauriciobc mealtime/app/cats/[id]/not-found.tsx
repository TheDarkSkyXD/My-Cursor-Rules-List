import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CatNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h2 className="text-2xl font-semibold">Gato não encontrado</h2>
      <p className="text-muted-foreground text-center max-w-[500px]">
        O gato que você está procurando não existe ou você não tem permissão para acessá-lo.
      </p>
      <Button asChild>
        <Link href="/cats">
          Voltar para lista de gatos
        </Link>
      </Button>
    </div>
  )
} 