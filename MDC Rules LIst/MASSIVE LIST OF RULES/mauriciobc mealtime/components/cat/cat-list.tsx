"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, History, Settings, Utensils } from "lucide-react"
import Link from "next/link"
import { useCats } from "@/lib/context/CatsContext"
import { useFeeding } from "@/lib/context/FeedingContext"
import { useUserContext } from "@/lib/context/UserContext"
import { calculateNextFeedingTimeForCat } from "@/lib/utils/feedingCalculations"
import { format, formatDistanceToNow, isBefore } from "date-fns"
import { useRouter } from "next/navigation"
import { CatType } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { NewFeedingSheet } from "@/components/new-feeding-sheet"
import { cn } from "@/lib/utils"

export function CatList() {
  const router = useRouter()
  const { state: catsState } = useCats()
  const { state: feedingState } = useFeeding()
  const { state: userState } = useUserContext()

  const { cats, isLoading: isLoadingCats, error: errorCats } = catsState
  const { feedingLogs, isLoading: isLoadingFeedings, error: errorFeedings } = feedingState
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedCatIdForSheet, setSelectedCatIdForSheet] = useState<string | null>(null)

  const isLoading = isLoadingCats || isLoadingFeedings || isLoadingUser
  const error = errorCats || errorFeedings || errorUser

  const householdCats = useMemo(() => {
    if (isLoading || !cats || !currentUser?.householdId) {
      return []
    }
    return cats.filter(cat => String(cat.householdId) === String(currentUser.householdId))
  }, [cats, currentUser?.householdId, isLoading])

  const lastLogMap = useMemo(() => {
    if (isLoadingFeedings || !feedingLogs) return new Map<string, CatType["feedingLogs"][0]>()
    
    const map = new Map<string, CatType["feedingLogs"][0]>()
    ;[...feedingLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .forEach(log => {
        if (!map.has(log.catId)) {
          map.set(log.catId, log)
        }
      })
    return map
  }, [feedingLogs, isLoadingFeedings])

  const handleFeedNowClick = (catId: string) => {
    setSelectedCatIdForSheet(catId)
    setIsSheetOpen(true)
  }

  const getFeedingStatus = useCallback((cat: CatType) => {
    if (isLoading || !currentUser) {
        return { text: "Carregando...", isDueSoon: false, isOverdue: false }
    }
    const lastLog = lastLogMap.get(cat.id)
    const timezone = currentUser?.preferences?.timezone || "UTC"
    
    const nextFeedingDateTime = calculateNextFeedingTimeForCat(cat, lastLog, [], timezone)

    if (!nextFeedingDateTime) {
        return { text: "Não configurado", isDueSoon: false, isOverdue: false }
    }

    const now = new Date()
    const isOverdue = isBefore(nextFeedingDateTime, now)
    const diffMs = nextFeedingDateTime.getTime() - now.getTime()
    const isDueSoon = !isOverdue && diffMs < 60 * 60 * 1000
    const text = isOverdue 
        ? `Atrasado (${formatDistanceToNow(nextFeedingDateTime, { addSuffix: true, locale: ptBR })})`
        : formatDistanceToNow(nextFeedingDateTime, { addSuffix: true, locale: ptBR })

    return { text, isDueSoon, isOverdue }
  }, [isLoading, currentUser, lastLogMap])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <CardContent className="p-0">
              <div className="flex items-center p-4 bg-muted/40">
                <Skeleton className="h-16 w-16 rounded-full border-2 border-muted" />
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </CardContent>
            <CardHeader className="flex flex-row justify-between items-center p-4">
              <div className="flex space-x-2">
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
              <Skeleton className="h-10 w-28 rounded-md" />
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-destructive text-center p-4">Erro ao carregar gatos: {error}</div>
  }

  if (householdCats.length === 0) {
    return (
        <Card className="mt-4">
            <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">Nenhum gato encontrado nesta residência.</p>
                <Button asChild>
                    <Link href="/cats/new">Adicionar Gato</Link>
                </Button>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-4">
      {householdCats.map((cat) => {
        const { text: nextFeedingText, isDueSoon, isOverdue } = getFeedingStatus(cat)
        return (
          <Card key={cat.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className={cn(
                  "flex items-center p-4 bg-gradient-to-r from-primary/5 to-secondary/5",
                  isOverdue ? "border-destructive" : ""
                )}>
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={cat.photoUrl || undefined} alt={cat.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {cat.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 flex-grow min-w-0">
                  <h2 className="text-xl font-bold truncate">{cat.name}</h2>
                  <div className={cn(
                      "flex items-center mt-1 text-sm",
                      isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                    )}>
                    <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    <span className="truncate">Próxima: {nextFeedingText}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 truncate">
                    {cat.portion_size ? `${cat.portion_size}g` : "Porção não definida"} 
                    {cat.feedingInterval ? ` a cada ${cat.feedingInterval}h` : " (Sem intervalo padrão)"}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardHeader className="flex flex-row justify-between items-center p-4 border-t">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                   <Link href={`/cats/${cat.id}/history`}> 
                      <History className="h-4 w-4 mr-2" /> Histórico
                   </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/cats/${cat.id}/settings`}>
                     <Settings className="h-4 w-4 mr-2" /> Ajustes
                  </Link>
                </Button>
              </div>
              <Button
                onClick={() => handleFeedNowClick(cat.id)}
                variant={isOverdue ? "destructive" : "default"}
                size="sm"
              >
                <Utensils className="h-4 w-4 mr-2" /> Alimentar Agora
              </Button>
            </CardHeader>
          </Card>
        )
      })}
      <NewFeedingSheet 
         isOpen={isSheetOpen}
         onOpenChange={setIsSheetOpen}
         initialCatId={selectedCatIdForSheet ? parseInt(selectedCatIdForSheet) : undefined}
       />
    </div>
  )
}

