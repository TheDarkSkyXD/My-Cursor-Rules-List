"use client"

import { useState, useEffect } from "react"
import { useRouter, notFound } from "next/navigation"
import { useUserContext } from "@/lib/context/UserContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Edit, 
  ArrowLeft, 
  Calendar, 
  Weight, 
  FileText, 
  Clock, 
  AlarmClock,
  Utensils,
  MoreHorizontal,
  Share2,
  Trash2,
  AlertTriangle,
  Ban,
  Users
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
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
import PageTransition from "@/components/page-transition"
import { format } from "date-fns"
import { useCats } from "@/lib/context/CatsContext"
import { useLoading } from "@/lib/context/LoadingContext"
import { useFeeding } from "@/hooks/use-feeding"
import { getAgeString } from "@/lib/utils/dateUtils"
import { toast } from "sonner"
import { ptBR } from "date-fns/locale"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { FeedingForm } from "./feeding-form"
import { CatType, FeedingLog, Schedule } from "@/lib/types"
import { FeedingHistory } from "./feeding-history"
import { Loading } from "@/components/ui/loading"
import { EmptyState } from "@/components/ui/empty-state"
import { redirectionLogger } from "@/lib/monitoring/redirection-logger"
import { headers } from 'next/headers'

interface CatDetailsProps {
  params: { id: string };
}

let redirectionCount = 0;

export default function CatDetails({ params }: CatDetailsProps) {
  // Component mount/unmount logging
  useEffect(() => {
    const startTime = performance.now();
    console.log("[CatDetails] Mount", { 
      catId: params.id,
      timestamp: new Date().toISOString()
    });

    return () => {
      const duration = performance.now() - startTime;
      console.log("[CatDetails] Unmount", { 
        catId: params.id,
        duration,
        timestamp: new Date().toISOString()
      });
    };
  }, [params.id]);

  const { state: userState } = useUserContext()
  const currentUser = userState.currentUser;
  const userLoading = userState.isLoading;
  const router = useRouter()
  const { state: catsState, dispatch: catsDispatch } = useCats()
  const { addLoadingOperation, removeLoadingOperation } = useLoading()
  const [isHydrated, setIsHydrated] = useState(false)
  
  // ID is guaranteed to be a string by the guard above
  const catId = params.id;
  
  const {
    cat, 
    logs, 
    nextFeedingTime, 
    formattedNextFeedingTime, 
    formattedTimeDistance, 
    isLoading: isFeedingLoading, 
    error: feedingHookError,
    handleMarkAsFed 
  } = useFeeding(catId)
  
  const [isClient, setIsClient] = useState(false)
  const [isProcessingDelete, setIsProcessingDelete] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [redirectTriggered, setRedirectTriggered] = useState(false);
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Set hydration state
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Handle authentication with useEffect to avoid setState during render
  useEffect(() => {
    // Only check auth after hydration to prevent flash redirects
    if (!isHydrated) return;
    
    // REMOVED REDIRECT LOGIC: Middleware handles this
    // if (!userLoading && !currentUser) {
    //   console.log("[CatDetails] Auth redirect", {
    //     catId: params.id,
    //     timestamp: new Date().toISOString(),
    //     hydrated: isHydrated,
    //     redirectionCount: ++redirectionCount
    //   });
    //   redirectionLogger.logAuthRedirection(`/cats/${params.id}`, undefined);
    //   router.push("/login")
    // }
  }, [userLoading, currentUser, router, params.id, isHydrated])

  // --- REVISED Error Handling & Early Return Logic ---
  useEffect(() => {
    if (redirectTriggered) {
      console.log("[CatDetails] Skipping error check - redirect already triggered", {
        catId,
        timestamp: new Date().toISOString(),
        redirectionCount
      });
      return;
    }

    console.log("[CatDetails] Error check running", {
      catId,
      feedingHookError: feedingHookError ? "present" : "none",
      catLoaded: !!cat,
      isLoading: isFeedingLoading,
      timestamp: new Date().toISOString()
    });

    if (!isFeedingLoading && (feedingHookError || !cat)) {
      const errorMessage = feedingHookError 
        ? `Erro ao carregar dados: ${feedingHookError}`
        : "Gato não encontrado ou você não tem permissão para vê-lo.";

      console.error("[CatDetails] Error detected", {
        catId,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });

      throw new Error(errorMessage);
    }
  }, [isFeedingLoading, feedingHookError, cat, catId]);

  // Loading state depends only on user and feeding hook
  const isLoading = userLoading || isFeedingLoading;

  // If still loading user/feeding data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Carregando..." />
      </div>
    );
  }

  // Final check: After all loading and initial effects, ensure 'cat' is available before rendering.
  // If 'cat' is null here, it implies an issue the useEffect should handle, so show loading while it does.
  if (!cat) {
    console.warn("[CatDetails] Render guard: 'cat' is null after loading checks. Waiting for error effect.");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Verificando dados do gato..." />
      </div>
    );
  }

  // Função para excluir o gato
  const handleDelete = async () => {
    const catIdStr = String(params.id);
    const opId = `delete-cat-${catIdStr}`;
    addLoadingOperation({ id: opId, description: `Excluindo ${cat?.name || 'gato'}...`, priority: 1 });
    setIsProcessingDelete(true);
    const previousCats = catsState.cats;

    catsDispatch({ type: "REMOVE_CAT", payload: String(params.id) });

    try {
      const response = await fetch(`/api/cats/${catIdStr}`, { method: 'DELETE' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao excluir o gato no servidor');
      }

      toast.success(`${cat.name} foi excluído`);
      throw new Error('DELETE_SUCCESS');

    } catch (error: any) {
      if (error.message === 'DELETE_SUCCESS') {
        throw error; // Re-throw the success "error" to trigger navigation
      }
      console.error("Erro ao excluir gato:", error);
      toast.error(`Falha ao excluir o gato: ${error.message}`);
      throw error;
    } finally {
      setIsProcessingDelete(false);
      setShowDeleteDialog(false);
      removeLoadingOperation(opId);
    }
  }

  return (
    <PageTransition>
      <div className="bg-background min-h-screen pb-4">
        <div className="container max-w-md mx-auto p-4">
          {/* Status Bar Spacer */}
          <div className="h-6"></div>
          
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/cats" className="flex items-center text-sm font-medium">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar para gatos
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Compartilhar</span>
              </Button>
              <Link href={`/cats/${cat.id}/edit`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Editar</span>
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Mais opções</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/cats/${cat.id}/edit`} className="cursor-pointer">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Gato
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600" 
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Gato
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Isso excluirá permanentemente {cat.name} e todos os seus registros de alimentação.
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessingDelete}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive hover:bg-destructive/90"
                          disabled={isProcessingDelete}
                        >
                          {isProcessingDelete ? <Loading text="Excluindo..." size="sm" /> : "Excluir"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Profile Header */}
          <div className="bg-card text-card-foreground rounded-xl p-5 mb-4 shadow-sm">
            <div className="flex items-center">
              <Avatar className="h-20 w-20 mr-4">
                <AvatarImage src={cat.photo_url || ""} alt={cat.name} />
                <AvatarFallback>{cat.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-2xl font-bold">{cat.name}</h1>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {cat.birthdate && (
                    <Badge className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{isClient ? getAgeString(new Date(cat.birthdate)) : "Carregando..."}</span>
                    </Badge>
                  )}
                  
                  {cat.weight && (
                    <Badge className="flex items-center gap-1">
                      <Weight className="h-3 w-3" />
                      <span>{cat.weight} kg</span>
                    </Badge>
                  )}
                  {cat.portion_size && (
                     <Badge className="flex items-center gap-1">
                      <Utensils className="h-3 w-3" />
                      <span>{cat.portion_size} g</span>
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center mt-3 text-sm text-muted-foreground">
                  <AlarmClock className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  <span>Próxima: {formattedNextFeedingTime || "Não programado"} ({formattedTimeDistance || "-"})</span>
                </div>
              </div>
            </div>

            {(cat.restrictions || cat.notes) && (
                <>
                    <Separator className="my-4" />
                    {cat.restrictions && (
                        <div className="flex items-start text-sm mb-2">
                            <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-amber-500 flex-shrink-0" />
                            <div>
                                <span className="font-medium">Restrições:</span>
                                <span className="text-muted-foreground ml-1">{cat.restrictions}</span>
                            </div>
                        </div>
                    )}
                    {cat.notes && (
                        <div className="flex items-start text-sm">
                            <FileText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div>
                                <span className="font-medium">Notas:</span>
                                <span className="text-muted-foreground ml-1">{cat.notes}</span>
                            </div>
                        </div>
                    )}
                </>
            )}
          </div>
          
          {/* Tabs */}
          <Tabs defaultValue="history" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="new">Registrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Alimentação</CardTitle>
                </CardHeader>
                <CardContent>
                  <FeedingHistory logs={logs} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="new" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Registrar Nova Alimentação</CardTitle>
                </CardHeader>
                <CardContent>
                  <FeedingForm 
                     catId={String(cat.id)}
                     onMarkAsFed={handleMarkAsFed}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
} 