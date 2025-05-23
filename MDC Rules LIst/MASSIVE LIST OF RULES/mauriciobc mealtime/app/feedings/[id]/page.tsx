"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Edit, Trash2, Utensils, AlertTriangle, Ban, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserContext } from "@/lib/context/UserContext"
import { useLoading } from "@/lib/context/LoadingContext"
import { Loading } from "@/components/ui/loading"
import { EmptyState } from "@/components/ui/empty-state"
import PageTransition from "@/components/page-transition"
import BottomNav from "@/components/bottom-nav"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { FeedingLog } from "@/lib/types"
import { resolveDateFnsLocale } from "@/lib/utils/dateFnsLocale"

interface FeedingLogDetails extends FeedingLog {
  // Assuming API returns cat and user nested
}

export default function FeedingDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { state: userState } = useUserContext()
  const { addLoadingOperation, removeLoadingOperation } = useLoading()
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState
  const userLanguage = userState.currentUser?.preferences?.language;
  const userLocale = resolveDateFnsLocale(userLanguage);

  const [isLoadingPage, setIsLoadingPage] = useState(true)
  const [feedingLog, setFeedingLog] = useState<FeedingLogDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const logId = resolvedParams.id

  if (isLoadingUser) {
    return <Loading text="Carregando sessão..." />
  }
  
  if (errorUser) {
     return (
       <PageTransition>
         <div className="flex flex-col min-h-screen bg-background">
            <div className="p-4 pb-24 text-center">
               <PageHeader title="Detalhes da Alimentação" />
               <p className="text-destructive mt-6">Erro ao carregar dados do usuário: {errorUser}</p>
               <Button onClick={() => router.back()} variant="outline" className="mt-4">Voltar</Button>
            </div>
            <BottomNav />
         </div>
       </PageTransition>
     );
  }
  
  if (!currentUser) {
    console.log("[FeedingDetailsPage] No currentUser found. Redirecting...");
    useEffect(() => {
        toast.error("Autenticação necessária.");
        router.replace(`/login?callbackUrl=/feedings/${logId}`);
    }, [router, logId]);
    return <Loading text="Redirecionando para login..." />;
  }
  
  if (!currentUser.householdId) {
     return (
       <PageTransition>
         <div className="flex flex-col min-h-screen bg-background">
            <div className="p-4 pb-24">
               <PageHeader title="Detalhes da Alimentação" />
               <EmptyState
                 IconComponent={Users}
                 title="Sem Residência Associada"
                 description="Associe-se a uma residência para ver detalhes."
                 actionButton={
                   <Button asChild variant="default" className="mt-4">
                     <a href="/settings">Ir para Configurações</a>
                   </Button>
                 }
                 className="mt-8"
               />
            </div>
            <BottomNav />
         </div>
       </PageTransition>
     );
  }

  useEffect(() => {
    if (!logId || typeof logId !== 'string' || logId.length < 10) {
      setIsLoadingPage(false)
      setError("ID do registro inválido.")
      return
    }

    setIsLoadingPage(true)
    setError(null)

    const fetchFeedingLog = async () => {
      const opId = `load-feeding-${logId}`
      addLoadingOperation({ id: opId, description: "Carregando registro..." })
      try {
        const headers: HeadersInit = {};
        if (currentUser?.id) {
            headers['X-User-ID'] = currentUser.id;
        } else {
            throw new Error("Usuário não autenticado para buscar registro.");
        }
        
        const response = await fetch(`/api/feedings/${logId}`, { headers });
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Registro de alimentação não encontrado.")
          } else if (response.status === 403) {
            throw new Error("Você não tem permissão para ver este registro.")
          } else {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Falha ao buscar registro: ${response.statusText}`)
          }
        }
        const data: FeedingLogDetails = await response.json()

        setFeedingLog(data)
      } catch (err: any) {
        console.error("Erro ao carregar registro de alimentação:", err)
        setError(err.message || "Erro ao carregar dados.")
        setFeedingLog(null)
      } finally {
        setIsLoadingPage(false)
        removeLoadingOperation(opId)
      }
    }

    fetchFeedingLog()
  }, [logId, currentUser?.id, currentUser?.householdId, addLoadingOperation, removeLoadingOperation])

  const handleDelete = async () => {
    if (!feedingLog || !currentUser?.householdId) {
      toast.error("Não é possível excluir: Dados ausentes ou inválidos.")
      return
    }

    const opId = `delete-feeding-${feedingLog.id}`
    addLoadingOperation({ id: opId, description: "Excluindo registro..." })
    setIsDeleting(true)
    const previousLogId = feedingLog.id

    try {
      const headers: HeadersInit = {};
      if (currentUser?.id) {
          headers['X-User-ID'] = currentUser.id;
      } else {
          toast.error("Erro de autenticação ao excluir.");
          throw new Error("User ID missing for delete request");
      }
      
      const response = await fetch(`/api/feedings/${feedingLog.id}`, {
         method: "DELETE",
         headers: headers
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro ao excluir registro (${response.status})`)
      }

      toast.success("Registro excluído com sucesso!")
      router.push("/feedings")
    } catch (error: any) {
      console.error("Erro ao excluir registro:", error)
      toast.error(`Erro ao excluir: ${error.message}`)
    } finally {
      setIsDeleting(false)
      removeLoadingOperation(opId)
    }
  }

  let content
  if (isLoadingPage) {
    content = <Loading text="Carregando detalhes do registro..." />
  } else if (error) {
    content = (
      <EmptyState
        IconComponent={AlertTriangle}
        title="Erro ao Carregar"
        description={error}
        actionButton={
          <Button asChild variant="default">
            <a href="/feedings">Voltar para Histórico</a>
          </Button>
        }
      />
    )
  } else if (!feedingLog) {
    content = (
      <EmptyState
        IconComponent={Ban}
        title="Registro Não Encontrado"
        description="O registro de alimentação não foi encontrado ou você não tem permissão para vê-lo."
        actionButton={
          <Button asChild variant="default">
            <a href="/feedings">Voltar para Histórico</a>
          </Button>
        }
      />
    )
  } else {
    content = (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{feedingLog.cat?.name || "Gato Desconhecido"}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  aria-label="Excluir Registro"
                >
                  {isDeleting ? <Loading size="sm" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </CardTitle>
            <div className="flex items-center gap-3 pt-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={feedingLog.cat?.photo_url || undefined} alt={feedingLog.cat?.name || "Gato"} />
                <AvatarFallback>{feedingLog.cat?.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                Alimentado em: {format(new Date(feedingLog.timestamp), "dd 'de' MMMM 'de' yyyy 'às' HH:mm")}
              </p>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Alimentação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Quantidade</h4>
              <p className="text-lg font-medium">
                {feedingLog.portionSize !== null && feedingLog.portionSize !== undefined
                  ? `${feedingLog.portionSize} g`
                  : <span className="text-muted-foreground italic">Não especificada</span>}
              </p>
            </div>

            {feedingLog.notes && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Observações</h4>
                <p className="text-base whitespace-pre-wrap">{feedingLog.notes}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Registrado por</h4>
              <p className="text-base">
                {feedingLog.user ? (
                  feedingLog.user.name || <span className="text-muted-foreground italic">Nome não disponível</span>
                ) : (
                  <span className="text-muted-foreground italic">Usuário não encontrado</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-background">
        <div className="p-4 pb-24">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <PageHeader title="Detalhes da Alimentação" />
          <div className="mt-6">
            {content}
          </div>
        </div>
        <BottomNav />
      </div>
    </PageTransition>
  )
} 