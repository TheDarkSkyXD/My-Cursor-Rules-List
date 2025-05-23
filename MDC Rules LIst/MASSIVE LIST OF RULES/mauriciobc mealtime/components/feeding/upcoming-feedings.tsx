"use client"

import { useState, useEffect, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, Clock } from "lucide-react"
import FeedingProgress from "@/components/ui/feeding-progress"
import { motion } from "framer-motion"
import { format, isBefore, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatInTimeZone, toDate } from 'date-fns-tz'
import { getUserTimezone, formatDateTimeForDisplay } from '@/lib/utils/dateUtils'
import { toast as sonnerToast } from 'sonner'
import { BaseCat, BaseUser, ID, FeedingLog } from "@/lib/types/common"
import { useUserContext } from "@/lib/context/UserContext"
import { useCats } from "@/lib/context/CatsContext"
import { useFeeding, useSelectUpcomingFeedings } from "@/lib/context/FeedingContext"
import { useSchedules } from "@/lib/context/ScheduleContext"
import { Skeleton } from "@/components/ui/skeleton"

export default function UpcomingFeedings() {
  const { state: userState } = useUserContext()
  const { state: catsState } = useCats()
  const { state: feedingState, dispatch: feedingDispatch } = useFeeding()
  const { state: schedulesState } = useSchedules()
  const { currentUser } = userState

  const upcomingFeedings = useSelectUpcomingFeedings(5)
  
  const isLoading = catsState.isLoading || feedingState.isLoading || schedulesState.isLoading || userState.isLoading
  const error = catsState.error || feedingState.error || schedulesState.error || userState.error

  const router = useRouter()
  const timezone = useMemo(() => getUserTimezone(currentUser?.preferences?.timezone), [currentUser?.preferences?.timezone])

  const handleFeedNow = async (catId: string) => {
    if (!currentUser?.id || !currentUser?.householdId) {
        sonnerToast.error("Erro: Usuário ou residência não identificados.")
        console.warn("handleFeedNow: User or householdId not found in context.")
        return
    }

    console.log(`handleFeedNow: Attempting to feed cat ${catId}`)

    type PostApiResponse = {
      id: string;
      timestamp: string;
      foodType: "dry" | "wet" | "treat" | "medicine" | "water";
      amount?: number | null;
      notes?: string | null;
      catId: string;
      userId: string;
    }

    try {
      const response = await fetch('/api/feedings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catId: catId,
          notes: 'Alimentado via "Próximas Alimentações"'
        }),
      })

      if (!response.ok) {
         let errorBody = 'Could not read error body'
         try { errorBody = await response.text() } catch (e) {}
         console.error(`handleFeedNow: Error response: ${response.status}`, errorBody)
         throw new Error(`Erro ao registrar alimentação (${response.status})`)
      }

      const apiResponse: PostApiResponse = await response.json()
      console.log("handleFeedNow: Feeding logged successfully (API Response):", apiResponse)

      const newLogForState: FeedingLog = {
        id: apiResponse.id,
        catId: apiResponse.catId,
        userId: apiResponse.userId,
        timestamp: new Date(apiResponse.timestamp),
        portionSize: apiResponse.amount,
        notes: apiResponse.notes,
        mealType: apiResponse.foodType,
        householdId: currentUser.householdId,
        user: {
          id: currentUser.id,
          name: currentUser.name ?? null,
          avatar: currentUser.avatar ?? null,
        },
        cat: undefined,
        status: undefined,
        createdAt: new Date(apiResponse.timestamp),
      };

      feedingDispatch({ 
          type: "ADD_FEEDING", 
          payload: newLogForState
      })

      sonnerToast.success('Alimentação registrada com sucesso!')

    } catch (error: any) {
      console.error('handleFeedNow: Error caught:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      sonnerToast.error(`Erro: ${errorMessage}`)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Próximas Alimentações</h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  if (error) {
     return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Próximas Alimentações</h2>
          <Card>
             <CardContent className="p-4 text-center text-destructive">
               Erro ao carregar dados: {error}
             </CardContent>
          </Card>
        </div>
     )
  }

  if (upcomingFeedings.length === 0) {
    return (
      <div className="space-y-4">
         <h2 className="text-xl font-semibold">Próximas Alimentações</h2>
         <Card>
           <CardContent className="p-4 text-center">
             <p className="text-muted-foreground">
               Nenhuma alimentação programada.
             </p>
           </CardContent>
         </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Próximas Alimentações</h2>
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {upcomingFeedings.map((feeding, index) => {
          return (
            <motion.div
              key={feeding.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`transition-colors ${feeding.isOverdue ? "border-destructive/50 bg-destructive/5" : "border"}`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={feeding.catPhoto || undefined} alt={feeding.catName} />
                      <AvatarFallback>{feeding.catName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{feeding.catName}</h3>
                      <p className={`text-xs flex items-center gap-1 ${feeding.isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {feeding.isOverdue 
                            ? `Atrasado (${formatDistanceToNow(feeding.nextFeeding, { locale: ptBR, addSuffix: true })})` 
                            : formatDateTimeForDisplay(feeding.nextFeeding, timezone)}
                        </span>
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant={feeding.isOverdue ? "destructive" : "outline"}
                      onClick={() => handleFeedNow(feeding.catId)}
                      className="flex-shrink-0 h-8 px-3"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Alimentar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
