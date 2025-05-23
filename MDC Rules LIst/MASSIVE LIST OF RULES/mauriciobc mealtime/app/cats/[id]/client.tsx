"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Trash2
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import PageTransition from "@/components/page-transition"
import { format } from "date-fns"
import { useCats } from "@/lib/context/CatsContext"
import { useLoading } from "@/lib/context/LoadingContext"
import { useFeeding } from "@/hooks/use-feeding"
import { getAgeString } from "@/lib/utils/dateUtils"
import { deleteCat as deleteCatService } from "@/lib/services/apiService"
import { toast } from "sonner"
import { notFound } from "next/navigation"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { FeedingForm } from "@/app/components/feeding-form"
import { CatType } from "@/lib/types"
import { Loading } from "@/components/ui/loading"
import { useUserContext } from "@/lib/context/UserContext"
import { resolveDateFnsLocale } from "@/lib/utils/dateFnsLocale"

// Interface para agendamentos (schedules)
interface Schedule {
  id: string;
  type: string;
  times: string;
  interval?: number;
  override_until?: string | Date;
  overrideUntil?: string | Date;
}

export default function CatDetailsClient({ id }: { id: string }) {
  const router = useRouter()
  const { state: catsState, dispatch: catsDispatch } = useCats()
  const { addLoadingOperation, removeLoadingOperation } = useLoading()
  const { 
    cat, 
    logs, 
    nextFeedingTime, 
    formattedNextFeedingTime, 
    formattedTimeDistance, 
    isLoading: isFeedingLoading,
    error: feedingError,
    handleMarkAsFed 
  } = useFeeding(id)
  const [isClient, setIsClient] = useState(false)
  const [isProcessingDelete, setIsProcessingDelete] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { state: userState } = useUserContext();
  const userLanguage = userState.currentUser?.preferences?.language;
  const userLocale = resolveDateFnsLocale(userLanguage);
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isFeedingLoading && feedingError) {
      toast.error(feedingError);
      // router.push('/cats'); // Commented out: Let user navigate manually on error
      return;
    }
  }, [feedingError, isFeedingLoading, router]);
  
  if (isFeedingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Carregando perfil do gato..." />
      </div>
    )
  }
  
  if (!cat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Gato não encontrado. Redirecionando..." />
      </div>
    );
  }

  // Cast para incluir schedules, já que o tipo CatType não tem essa propriedade
  const catWithSchedules = cat as CatType & { schedules?: Schedule[] };

  // New delete handler: submit the form, then handle UI updates
  const handleDelete = () => {
    const opId = `delete-cat-${id}`;
    addLoadingOperation({ id: opId, description: `Excluindo ${cat?.name || 'gato'}...`, priority: 1 });
    setIsProcessingDelete(true);
    const previousCats = catsState.cats;

    // Optimistic update
    catsDispatch({ type: "REMOVE_CAT", payload: id });

    // Submit the form (triggers API route)
    const form = document.getElementById('delete-cat-form') as HTMLFormElement;
    if (form) {
      form.submit();
    }
    // After form submission, the page will reload or redirect via router.push
    // Remove loading state after a short delay (fallback)
    setTimeout(() => {
      setIsProcessingDelete(false);
      setShowDeleteDialog(false);
      removeLoadingOperation(opId);
    }, 2000);
  };

  return (
    <>
      {/* Hidden form for deletion (must be in JSX, not top-level) */}
      <form id="delete-cat-form" action={`/api/cats/${cat.id}`} method="POST" style={{ display: 'none' }}>
        <input type="hidden" name="_method" value="DELETE" />
      </form>
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
                            Isso excluirá permanentemente {cat?.name || 'este gato'} e todos os seus registros de alimentação.
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
                        <span>{isClient && cat.birthdate ? getAgeString(new Date(cat.birthdate)) : "Carregando..."}</span>
                      </Badge>
                    )}
                    
                    {cat.weight && (
                      <Badge className="flex items-center gap-1">
                        <Weight className="h-3 w-3" />
                        <span>{cat.weight} kg</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Next Feeding Info */}
              {nextFeedingTime && (
                <div className="mt-4 bg-primary/10 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <AlarmClock className="h-5 w-5 text-primary mr-2" />
                    <div>
                      <p className="text-sm font-medium text-primary-foreground/90">Próxima alimentação</p>
                      <p className="text-xs text-primary-foreground/70">
                        {isClient && nextFeedingTime ? (
                          <>
                            {formattedNextFeedingTime}
                            {" "}
                            ({formattedTimeDistance})
                          </>
                        ) : (
                          "Carregando..."
                        )}
                      </p>
                    </div>
                  </div>
                  <Button 
                    className="py-1 px-3 text-sm"
                    onClick={() => handleMarkAsFed()}
                  >
                    <Utensils className="h-3 w-3 mr-1" />
                    Alimentar agora
                  </Button>
                </div>
              )}
            </div>
            
            {/* Tabs Section */}
            <Tabs defaultValue="feeding">
              <TabsList className="grid grid-cols-2 mb-4 bg-muted/50">
                <TabsTrigger value="feeding">Alimentação</TabsTrigger>
                <TabsTrigger value="schedules">Programação</TabsTrigger>
              </TabsList>
              
              {/* Feeding Tab */}
              <TabsContent value="feeding" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Registrar Alimentação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FeedingForm catId={cat.id} onMarkAsFed={handleMarkAsFed} />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Histórico de Alimentação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {logs.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium mb-1">Nenhum registro de alimentação</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Comece a registrar alimentações para ver o histórico aqui
                        </p>
                        <Button
                          onClick={() => handleMarkAsFed()}
                          className="gap-2"
                        >
                          <Utensils className="h-4 w-4" />
                          Registrar alimentação agora
                        </Button>
                      </div>
                    ) : (
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-4">
                          {logs.map((log) => {
                            const feederName = "Usuário do Sistema";
                            
                            return (
                              <div key={log.id} className="flex items-start gap-3 pb-3 border-b">
                                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {format(new Date(log.timestamp), "PPp")}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Alimentado por: {feederName}
                                  </p>
                                  {log.portionSize && (
                                    <Badge variant="outline" className="mt-1">
                                      {log.portionSize} porções
                                    </Badge>
                                  )}
                                  {log.notes && (
                                    <p className="text-xs mt-1">{log.notes}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <ScrollBar />
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Schedules Tab */}
              <TabsContent value="schedules" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle>Agendamentos</CardTitle>
                      <Button size="sm" asChild>
                        <Link href={`/cats/${cat.id}/schedules/new`}>
                          Adicionar
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {catWithSchedules.schedules && catWithSchedules.schedules.length > 0 ? (
                      <div className="space-y-4">
                        {catWithSchedules.schedules.map((schedule) => (
                          <Card key={schedule.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">
                                    {schedule.type === "fixedTime" ? "Horário Fixo" : "Intervalo"}
                                  </h3>
                                  {schedule.type === "fixedTime" ? (
                                    <p className="text-sm">
                                      Horários: {typeof schedule.times === 'string' ? schedule.times.split(",").join(", ") : ''}
                                    </p>
                                  ) : (
                                    <p className="text-sm">
                                      A cada {schedule.interval} horas
                                    </p>
                                  )}
                                  { (schedule['override_until'] ?? schedule['overrideUntil']) && (
                                    <Badge variant="secondary" className="mt-2">
                                      Temporário até {format(new Date(schedule['override_until'] ?? schedule['overrideUntil']), "PP")}
                                    </Badge>
                                  )}
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/cats/${cat.id}/schedules/${schedule.id}/edit`}>
                                    <Edit className="h-3 w-3 mr-1" />
                                    Editar
                                  </Link>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="mb-4">Nenhum agendamento configurado</p>
                        <Button asChild>
                          <Link href={`/cats/${cat.id}/schedules/new`}>
                            Criar Agendamento
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PageTransition>
    </>
  )
}