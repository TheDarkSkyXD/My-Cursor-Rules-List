"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, Search, SortDesc, Utensils, CheckCircle2, AlertCircle, Ban, AlertTriangle, HelpCircle, Users, Trash2 } from "lucide-react"
import Link from "next/link"
import PageTransition from "@/components/page-transition"
import BottomNav from "@/components/bottom-nav"
import { motion } from "framer-motion"
import { EmptyState } from "@/components/ui/empty-state"
import { Loading } from "@/components/ui/loading"
import { PageHeader } from "@/components/page-header"
import { useCats } from "@/lib/context/CatsContext"
import { useFeeding } from "@/lib/context/FeedingContext"
import { useUserContext } from "@/lib/context/UserContext"
import { useLoading } from "@/lib/context/LoadingContext"
import { FeedingLog } from "@/lib/types"
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { groupLogsByDate } from "@/lib/utils/feedingUtils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { resolveDateFnsLocale } from "@/lib/utils/dateFnsLocale"

// Helper functions for status display
const getStatusIcon = (status: string | undefined) => {
  switch (status) {
    case "Normal":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "Comeu Pouco":
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case "Recusou":
      return <Ban className="h-5 w-5 text-red-500" />;
    case "Vomitou":
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case "Outro":
      return <HelpCircle className="h-5 w-5 text-blue-500" />;
    default:
      return null; // Return null if no specific icon needed, or keep Utensils if preferred as default
  }
};

// Only allowed variants: "default" | "secondary" | "destructive" | "outline"
const getStatusVariant = (status: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Normal":
      return "default";
    case "Comeu Pouco":
      return "secondary"; // changed from 'warning' to 'secondary'
    case "Recusou":
    case "Vomitou":
      return "destructive";
    case "Outro":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusText = (status: string | undefined) => {
  return status || "-"; // Simplify: return status directly or '-' if undefined/empty
};

export default function FeedingsPage() {
  const router = useRouter()
  const { state: catsState } = useCats()
  const { state: feedingState, dispatch: feedingDispatch } = useFeeding()
  const { state: userState } = useUserContext()
  const { addLoadingOperation, removeLoadingOperation } = useLoading()

  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState
  const { cats, isLoading: isLoadingCats, error: errorCats } = catsState
  const { feedingLogs, isLoading: isLoadingFeedings, error: errorFeedings } = feedingState

  const isLoading = isLoadingUser || isLoadingCats || isLoadingFeedings
  const error = errorUser || errorCats || errorFeedings

  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [logToDelete, setLogToDelete] = useState<FeedingLog | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const userLanguage = userState.currentUser?.preferences?.language;
  const userLocale = resolveDateFnsLocale(userLanguage);

  // Memoized filtering and sorting
  const filteredAndSortedLogs = useMemo(() => {
    if (!feedingLogs || !cats) return []

    let logs = [...feedingLogs]

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      logs = logs.filter(log => {
          const catName = cats.find(c => String(c.id) === String(log.catId))?.name.toLowerCase() || ""
          const notes = log.notes?.toLowerCase() || ""
          const userName = log.user?.name?.toLowerCase() || ""
          return catName.includes(lowerSearchTerm) || notes.includes(lowerSearchTerm) || userName.includes(lowerSearchTerm)
        }
      )
    }

    // Apply sorting
    logs.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })

    console.log("[FeedingsPage] Filtered and Sorted Logs:", logs); // Log filtered logs
    return logs
  }, [feedingLogs, cats, searchTerm, sortOrder])

  // Memoized grouping by date
  const groupedLogs = useMemo(() => {
     const groups = groupLogsByDate(filteredAndSortedLogs)
     console.log("[FeedingsPage] Grouped Logs:", groups); // Log grouped logs
     return groups
  }, [filteredAndSortedLogs])

  // Delete handler - Update to use string ID
  const handleDeleteFeedingLog = async (logId: string | undefined) => {
     if (!logId) {
        toast.warning("ID do registro inválido para exclusão.")
        return
     }
     
     const opId = `delete-feeding-${logId}`
     addLoadingOperation({ id: opId, description: "Excluindo registro..." })
     setIsDeleting(true)
     
     const previousLogs = feedingState.feedingLogs
     // Find log using string comparison
     const logToDeleteObject = previousLogs.find(log => log.id === logId)

     if (!logToDeleteObject) {
       toast.error("Erro: Registro não encontrado para exclusão.")
       setIsDeleting(false)
       removeLoadingOperation(opId)
       setLogToDelete(null) // Close dialog if log not found
       return
     }
     
     // Optimistic UI update - Pass the full object
     feedingDispatch({ type: "REMOVE_FEEDING", payload: logToDeleteObject })
     setLogToDelete(null) // Close dialog immediately after optimistic update

     try {
       // Add X-User-ID header
       const headers: HeadersInit = {};
       if (currentUser?.id) {
           headers['X-User-ID'] = currentUser.id;
       } else {
           toast.error("Erro de autenticação ao excluir.");
           throw new Error("User ID missing for delete request");
       }
       
       // Use string ID in URL
       const response = await fetch(`/api/feedings/${logId}`, {
         method: 'DELETE',
         headers: headers // Add headers
       })
       if (!response.ok) {
         const errorData = await response.json().catch(() => ({}))
         // Revert optimistic update on failure
         feedingDispatch({ type: "FETCH_SUCCESS", payload: previousLogs })
         throw new Error(errorData.error || `Falha ao excluir registro: ${response.statusText}`)
       }
       toast.success("Registro excluído com sucesso!")
     } catch (error: any) {
       console.error("Erro ao deletar registro de alimentação:", error)
       toast.error(`Erro ao excluir: ${error.message || "Ocorreu um erro desconhecido"}`)
       // Ensure state is reverted if fetch fails
       if(feedingState.feedingLogs.find(log => log.id === logId) === undefined) {
          feedingDispatch({ type: "FETCH_SUCCESS", payload: previousLogs })
       }
     } finally {
       setIsDeleting(false)
       removeLoadingOperation(opId)
       // Ensure dialog is closed even if fetch fails but optimistic update happened
       if (logToDelete?.id === logId) {
          setLogToDelete(null)
       }
     }
   }

  // --- Render Logic ---

  // 1. Handle Combined Loading State
  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex flex-col min-h-screen bg-background">
          <div className="p-4 pb-24">
            <PageHeader title="Histórico de Alimentações" description="Veja todos os registros" />
            <Loading text="Carregando histórico..." />
          </div>
          <BottomNav />
        </div>
      </PageTransition>
    )
  }

  // 2. Handle Combined Error State
  if (error) {
    return (
      <PageTransition>
        <div className="flex flex-col min-h-screen bg-background">
          <div className="p-4 pb-24">
            <PageHeader title="Histórico de Alimentações" description="Erro ao carregar dados" />
            <EmptyState title="Erro ao Carregar" description={error || "Não foi possível buscar os dados."} IconComponent={AlertTriangle} />
          </div>
          <BottomNav />
        </div>
      </PageTransition>
    )
  }

  // 3. Handle No Authenticated User Found (after loading/error checks)
  if (!currentUser) {
    console.log("[FeedingsPage] No currentUser found. Redirecting...");
    useEffect(() => {
        toast.error("Autenticação necessária para ver o histórico.");
        router.replace("/login?callbackUrl=/feedings"); // Use replace
    }, [router]);
    return <Loading text="Redirecionando para login..." />;
  }

  // 4. Handle Authenticated but no household associated
  if (!currentUser.householdId) {
    return (
      <PageTransition>
        <div className="flex flex-col min-h-screen bg-background">
          <div className="p-4 pb-24">
            <PageHeader
              title="Histórico de Alimentações"
              description="Veja todos os registros"
            />
            <EmptyState
              IconComponent={Users}
              title="Sem Residência Associada"
              description="Você precisa criar ou juntar-se a uma residência para ver e registrar alimentações."
              actionButton={
                <Button asChild>
                  <Link href="/settings">Ir para Configurações</Link>
                </Button>
              }
              className="mt-6"
            />
          </div>
          <BottomNav />
        </div>
      </PageTransition>
    )
  }

  // Main content render
  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-background">
        <div className="p-4 pb-24">
          <PageHeader
            title="Histórico de Alimentações"
            description="Veja todos os registros de alimentação dos seus gatos"
            actionLabel={currentUser?.householdId ? "Registrar" : undefined}
            actionHref={currentUser?.householdId ? "/feedings/new" : undefined}
          />

          {/* Search and Sort Controls */}
          <div className="flex items-center gap-2 mb-6 sticky top-0 bg-background py-3 z-20 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por gato, notas, usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm h-9 focus-visible:ring-primary"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
              title={sortOrder === "desc" ? "Ordenar: Mais recentes primeiro" : "Ordenar: Mais antigos primeiro"}
            >
              <SortDesc className={`h-4 w-4 transform transition-transform duration-200 ${sortOrder === "asc" ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Timeline or Empty State */}
          {filteredAndSortedLogs.length === 0 && !isLoading ? (
            <EmptyState
              IconComponent={Utensils}
              title="Nenhum registro encontrado"
              description={searchTerm
                ? "Nenhum registro corresponde à sua busca. Tente outros termos."
                : "Ainda não há registros de alimentação. Que tal registrar o primeiro?"}
              actionButton={
                !searchTerm ? (
                  <Button asChild>
                    <Link href="/feedings/new">Registrar Alimentação</Link>
                  </Button>
                ) : undefined
              }
              className="mt-12"
            />
          ) : (
            <Timeline>
              {Object.entries(groupedLogs).map(([date, logsOnDate]) => (
                <React.Fragment key={date}>
                  {/* Date Header */}
                  <h2 className="text-lg font-semibold my-4 sticky top-[68px] bg-background py-2 z-10"> {/* Adjusted sticky top */}
                    {format(new Date(date), "EEEE, dd 'de' MMMM 'de' yyyy")}
                  </h2>
                  {/* Logs for the Date */}
                  {logsOnDate.map((log) => {
                    console.log(`[FeedingsPage] Rendering log item ID: ${log.id}`); // Log each item rendering
                    const cat = cats.find(c => String(c.id) === String(log.catId))
                    const displayStatusIcon = getStatusIcon(log.status);
                    const displayStatusVariant = getStatusVariant(log.status);
                    const displayStatusText = getStatusText(log.status);
                    
                    return (
                      // Replace TimelineItem with a custom structure
                      <div key={log.id} className="relative pl-[58px] mb-4 group"> {/* Adjust left padding to make space for the absolute positioned Avatar */}
                        {/* Manual Timeline Dot/Icon (Avatar) */}
                        <div className="absolute left-0 top-0 flex-shrink-0"> {/* Position Avatar absolutely to the left */}
                          <Link href={`/cats/${cat?.id}`} aria-label={`Ver perfil de ${cat?.name}`}>
                            <Avatar className="h-10 w-10 border shadow-md"> {/* Match icon size from original TimelineItem */}
                              <AvatarImage src={cat?.photo_url || undefined} alt={cat?.name} />
                              <AvatarFallback>{cat?.name?.substring(0, 1).toUpperCase() || "?"}</AvatarFallback>
                            </Avatar>
                          </Link>
                        </div>
                        {/* Custom content layout */}
                        <div className="flex items-start gap-8 w-full">
                           {/* Time Column */}
                          <div className="text-right text-sm text-muted-foreground pt-1 w-16 flex-shrink-0 tabular-nums -ml-[58px] pl-12"> {/* Use negative margin to pull time back into the padding space */}
                            {format(new Date(log.timestamp), "HH:mm")}
                          </div>

                          {/* Main Content Card (moves to the right of the Avatar/dot) */}
                          <Card className="flex-grow shadow-sm transition-shadow hover:shadow-md ml-2"> {/* Add small margin left for spacing from Avatar */}
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between gap-2">
                                {/* Cat Name/User (No Avatar needed here anymore) */}
                                <div className="min-w-0">
                                  <Link href={`/cats/${cat?.id}`} className="font-medium truncate hover:underline text-sm sm:text-base">
                                    {cat?.name || "Gato Desconhecido"}
                                  </Link>
                                  {log.user && (
                                    <p className="text-xs text-muted-foreground truncate" title={`Registrado por ${log.user?.name}`}>
                                      por {log.user?.name || "Usuário Desconhecido"}
                                    </p>
                                  )}
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                                  {log.portionSize != null && log.portionSize > 0 && (
                                    <Badge variant="outline" className="text-xs px-1.5 sm:px-2.5">
                                      {log.portionSize}g
                                    </Badge>
                                  )}
                                  {displayStatusIcon && (
                                      <span title={displayStatusText}>{displayStatusIcon}</span>
                                  )}
                                  {log.status && log.status !== 'Normal' && ( // Optionally hide "Normal" badge for cleaner look
                                    <Badge variant={displayStatusVariant} className="text-xs px-1.5 sm:px-2.5">
                                      {displayStatusText}
                                    </Badge>
                                  )}
                                  {/* Delete Button with Dialog */}
                                  <AlertDialog open={logToDelete?.id === log.id} onOpenChange={(open) => { if (!open) setLogToDelete(null) }}>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => { e.stopPropagation(); setLogToDelete(log); }}
                                        aria-label="Excluir registro"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir este registro de alimentação?
                                          {log && ` (Gato: ${cats.find(c => String(c.id) === String(log.catId))?.name || 'Desconhecido'}, Data: ${format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')})`}
                                          <br />
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setLogToDelete(null)} disabled={isDeleting}>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteFeedingLog(log.id ? String(log.id) : undefined)}
                                          disabled={isDeleting || !logToDelete || logToDelete.id !== log.id}
                                          className="bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive"
                                        >
                                          {isDeleting && logToDelete?.id === log.id ? <Loading text="Excluindo..." size="sm" className="text-white"/> : "Excluir"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                              {/* Notes */}
                              {log.notes && (
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                  &quot;{log.notes}&quot;
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </Timeline>
          )}
        </div>

        <BottomNav />
      </div>
    </PageTransition>
  )
} 