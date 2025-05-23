"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addHours, isBefore, parseISO, compareAsc, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/lib/context/UserContext";
import { useCats } from "@/lib/context/CatsContext";
import { useFeeding, useSelectUpcomingFeedings } from "@/lib/context/FeedingContext";
import { useSchedules } from "@/lib/context/ScheduleContext";
import { getUserTimezone, formatDateTimeForDisplay } from '@/lib/utils/dateUtils';
import { CatType, FeedingLog, Schedule, ID } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedingSchedule() {
  const { state: userState } = useUserContext();
  const { state: catsState } = useCats();
  const { state: feedingState } = useFeeding();
  const { state: schedulesState } = useSchedules();
  const { currentUser } = userState;
  const timezone = useMemo(() => getUserTimezone(currentUser?.preferences?.timezone), [currentUser?.preferences?.timezone]);
  
  const upcomingFeedings = useSelectUpcomingFeedings(5);
  
  const isLoading = catsState.isLoading || feedingState.isLoading || schedulesState.isLoading || userState.isLoading;
  
  const router = useRouter();

  const handleFeedNow = (catId: ID) => {
    router.push(`/feedings/new?catId=${catId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="loading-skeleton">
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
    );
  }
  
  if (upcomingFeedings.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground">
            Nenhuma alimentação futura programada ou calculada.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {upcomingFeedings.map((feeding, index) => (
        <motion.div
          key={feeding.id}
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
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
      ))}
    </motion.div>
  );
} 