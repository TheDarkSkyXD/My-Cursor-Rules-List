"use client"

import { useState, useEffect } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { useFeeding } from "@/lib/context/FeedingContext"
import { FeedingLog } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { useCats } from "@/lib/context/CatsContext"

export default function EventsList() {
  const { state: feedingState } = useFeeding()
  const { feedingLogs, isLoading, error } = feedingState
  const { state: catsState } = useCats()
  const { cats, isLoading: isLoadingCats } = catsState

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-2/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-destructive">
          Erro ao carregar eventos: {error}
        </CardContent>
      </Card>
    )
  }

  const recentLogs = (feedingLogs || []).slice(0, 5)

  if (recentLogs.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground">
            Nenhum registro de alimentação encontrado.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {recentLogs.map((log, index) => {
        let cat = log.cat
        if (!cat || !cat.name) {
          cat = cats.find(c => String(c.id) === String(log.catId))
        }
        const catName = cat?.name || "Gato Desconhecido"
        const catPhoto = cat?.photoUrl || cat?.photo_url || undefined
        const catInitials = catName.substring(0, 2).toUpperCase()
        return (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={catPhoto} alt={catName} />
                    <AvatarFallback>
                      {catInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{catName}</h3>
                        {log.user && (
                          <p className="text-xs text-muted-foreground">
                            Alimentado por {log.user?.name || "Usuário Desconhecido"}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.timestamp), { 
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    </div>
                    {log.portionSize != null && (
                      <p className="text-xs mt-1">
                        <span className="font-medium">Quantidade:</span> {log.portionSize}g
                      </p>
                    )}
                    {log.notes && (
                      <p className="text-xs mt-1 text-muted-foreground">
                        <span className="font-medium">Notas:</span> {log.notes}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
