"use client"

import { useState, useEffect, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Edit, 
  Plus, 
  Calendar, 
  Weight, 
  FileWarning, 
  Clock, 
  Trash2,
  ChevronRight,
  Cat as CatIcon,
  Users,
  PlusCircle,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import BottomNav from "@/components/bottom-nav"
import PageTransition from "@/components/page-transition"
import { motion } from "framer-motion"
import { CatType, FeedingLog } from "@/lib/types"
import { getAgeString, getScheduleText } from "@/lib/utils/dateUtils"
import { AppHeader } from "@/components/app-header"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns/formatDistanceToNow"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { useCats } from "@/lib/context/CatsContext"
import { useUserContext } from "@/lib/context/UserContext"
import { useLoading } from "@/lib/context/LoadingContext"
import { CatCard } from "@/components/cat/cat-card"
import { Loading } from "@/components/ui/loading"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import { useFeeding } from "@/lib/context/FeedingContext"
import { GlobalLoading } from "@/components/ui/global-loading"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CatsPage() {
  const router = useRouter()
  const { state: catsState, dispatch: catsDispatch } = useCats()
  const { state: userState } = useUserContext()
  const { addLoadingOperation, removeLoadingOperation } = useLoading()
  const { cats, isLoading: isLoadingCats, error: errorCats } = catsState
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState
  const { state: feedingState } = useFeeding()
  const { feedingLogs } = feedingState
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser && !isLoadingUser) {
      toast.error("Você precisa estar conectado para ver seus gatos.");
      router.replace("/login");
    }
  }, [currentUser, isLoadingUser, router]);

  const catsToDisplay = useMemo(() => {
    if (!currentUser?.householdId || !cats) return [];
    return cats.filter(cat => String(cat.householdId) === String(currentUser.householdId));
  }, [cats, currentUser?.householdId]);

  const latestLogMap = useMemo(() => {
    if (!feedingLogs) return new Map<string, FeedingLog>();
    
    const map = new Map<string, FeedingLog>();
    [...feedingLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .forEach(log => {
        const catIdStr = String(log.catId);
        if (!map.has(catIdStr)) {
          map.set(catIdStr, log);
        }
      });
    return map;
  }, [feedingLogs]);

  const handleDeleteCat = async (catId: string) => {
    const previousCats = cats
    const opId = `delete-cat-${catId}`
    addLoadingOperation({ id: opId, priority: 1, description: `Deleting cat ${catId}...` })
    setIsDeleting(catId)
    
    catsDispatch({ type: "REMOVE_CAT", payload: catId })

    try {
      const response = await fetch(`/api/cats/${catId}`, { method: 'DELETE' })
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}))
         throw new Error(errorData.error || 'Failed to delete cat')
      }
      toast.success("Gato excluído com sucesso!")
    } catch (error: any) {
      console.error("Erro ao excluir gato:", error)
      toast.error(`Erro ao excluir gato: ${error.message}`)
      catsDispatch({ type: "FETCH_SUCCESS", payload: previousCats })
    } finally {
      setIsDeleting(null)
      removeLoadingOperation(opId)
    }
  }

  if (isLoadingUser || isLoadingCats) {
    return (
      <PageTransition>
        <div className="flex flex-col min-h-screen bg-background">
          <div className="flex-1 p-4 flex items-center justify-center">
            <GlobalLoading mode="spinner" text="Carregando..." />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (errorCats || errorUser) {
    return (
      <PageTransition>
        <div className="flex flex-col min-h-screen bg-background">
          <div className="flex-1 p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>
                {errorCats || errorUser}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!currentUser) {
    return <Loading text="Verificando sessão..." />;
  }
  
  if (!currentUser.householdId) { 
    return (
      <PageTransition>
        <div className="flex flex-col min-h-screen bg-background">
           <div className="flex-1 p-4 pb-24">
              <PageHeader
                title="Meus Gatos"
                description="Gerencie seus gatos e seus perfis"
                icon={<Users className="h-6 w-6" />}
              />
             <EmptyState
                IconComponent={Users}
                title="Sem Residência Associada"
                description="Você precisa criar ou juntar-se a uma residência para adicionar e gerenciar gatos."
                actionButton={
                  <Link href="/settings">
                    <Button variant="outline">Ir para Configurações</Button>
                  </Link>
                }
                className="max-w-xl mx-auto my-12"
             />
           </div>
           <BottomNav />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 p-4 pb-24">
          <PageHeader
            title="Meus Gatos"
            description="Gerencie os perfis dos seus felinos"
            actionLabel="Adicionar Gato"
            actionHref="/cats/new"
            actionVariant="outline"
            icon={<CatIcon className="h-6 w-6" />}
          />

          {catsToDisplay.length === 0 ? (
             <div className="mt-6">
               <EmptyState
                 IconComponent={CatIcon}
                 title="Nenhum gato cadastrado"
                 description="Você ainda não adicionou nenhum gato a esta residência. Que tal adicionar o primeiro?"
                 actionButton={
                   <Link href="/cats/new">
                     <Button variant="outline">Adicionar Meu Primeiro Gato</Button>
                   </Link>
                 }
               />
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
              {catsToDisplay.map((cat: CatType) => {
                const latestLog = latestLogMap.get(String(cat.id)) ?? null;
                return (
                  <CatCard
                    key={cat.id}
                    cat={cat}
                    latestFeedingLog={latestLog}
                    onView={() => router.push(`/cats/${cat.id}`)}
                    onEdit={() => router.push(`/cats/${cat.id}/edit`)}
                    onDelete={() => handleDeleteCat(cat.id)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </PageTransition>
  )
}
