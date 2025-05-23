"use client"

import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { calculateNextFeeding, formatDateTimeForDisplay, getUserTimezone } from '@/lib/utils/dateUtils';
import { useUserContext } from "@/lib/context/UserContext";
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { addHours, differenceInHours } from 'date-fns';
import { motion } from "framer-motion"
import { useAnimation } from "@/components/animation-provider"
import { Skeleton } from "@/components/ui/skeleton";

interface FeedingProgressProps {
  lastFed: Date | null | undefined;
  interval: number
  size?: number
  strokeWidth?: number
  color?: string
  bgColor?: string
}

export default function FeedingProgress({
  lastFed,
  interval,
  size = 40,
  strokeWidth = 4,
  color = "#000",
  bgColor = "#e5e7eb",
}: FeedingProgressProps) {
  const { shouldAnimate } = useAnimation()
  const [progress, setProgress] = useState(0)
  const { currentUser, loading: userLoading } = useUserContext();
  const timezone = getUserTimezone(currentUser?.preferences?.timezone);

  const [nextFeedingTime, setNextFeedingTime] = useState<Date | null>(null);

  // Memoize the calculation function to prevent unnecessary recreations
  const calculateProgress = useCallback(() => {
    if (!lastFed || !timezone) {
      console.log('[Debug FeedingProgress] Última alimentação ou timezone não definidos');
      return;
    }

    console.log('[Debug Progress] Iniciando cálculo de progresso:');
    console.log('- Última alimentação:', formatDateTimeForDisplay(lastFed, timezone));
    console.log('- Intervalo:', interval, 'horas');
    console.log('- Timezone:', timezone);
    
    try {
      // Converter última alimentação para o timezone do usuário
      const lastFedInTz = toDate(lastFed, { timeZone: timezone });
      console.log('- Última alimentação (TZ):', formatDateTimeForDisplay(lastFedInTz, timezone));
      
      // Obter hora atual no timezone do usuário
      const now = toDate(new Date(), { timeZone: timezone });
      console.log('- Hora atual:', formatDateTimeForDisplay(now, timezone));
      
      // Calcular o próximo horário usando a função centralizada
      const nextFeeding = calculateNextFeeding(lastFedInTz, interval, timezone);
      console.log('- Próximo horário:', formatDateTimeForDisplay(nextFeeding, timezone));
      setNextFeedingTime(nextFeeding);

      // Calcular quantos intervalos se passaram desde a última alimentação
      const hoursElapsed = differenceInHours(now, lastFedInTz);
      const intervalsElapsed = Math.floor(hoursElapsed / interval);
      console.log('- Horas decorridas:', hoursElapsed);
      console.log('- Intervalos completos:', intervalsElapsed);
      
      // Calcular progresso como porcentagem do tempo decorrido no intervalo atual
      const currentIntervalStart = addHours(lastFedInTz, intervalsElapsed * interval);
      console.log('- Início do intervalo atual:', formatDateTimeForDisplay(currentIntervalStart, timezone));
      
      const totalDuration = interval * 60 * 60 * 1000; // intervalo em milissegundos
      const elapsed = now.getTime() - currentIntervalStart.getTime();
      console.log('- Duração total do intervalo (horas):', totalDuration / (60 * 60 * 1000));
      console.log('- Tempo decorrido (horas):', elapsed / (60 * 60 * 1000));

      // Garantir que o progresso esteja entre 0 e 100
      const calculatedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      console.log('- Progresso calculado:', calculatedProgress.toFixed(2), '%');
      setProgress(calculatedProgress);
    } catch (error) {
      console.error('[Debug FeedingProgress] Erro no cálculo:', error);
    }
  }, [lastFed, interval, timezone]);

  useEffect(() => {
    console.log('[Debug FeedingProgress] useEffect iniciado');
    // Initial calculation only if timezone is loaded
    if (timezone) {
        calculateProgress()
    }
    
    // Update every minute if timezone is loaded
    let timer: NodeJS.Timeout | null = null;
    if (timezone) {
      timer = setInterval(calculateProgress, 60000)
    }

    return () => {
      console.log('[Debug FeedingProgress] useEffect cleanup');
      if (timer) clearInterval(timer)
    }
  }, [calculateProgress, timezone])

  // Handle loading state for user/timezone
  if (userLoading) {
    return (
      <div className="relative w-full space-y-2">
        <Skeleton className="h-2 w-full" />
        <div className="flex justify-between text-sm text-gray-500">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  // Handle case where lastFed is not provided
  if (!lastFed) {
    return (
      <div className="relative w-full text-center text-sm text-gray-500 py-2">
        Sem registro de alimentação.
      </div>
    )
  }

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  if (!shouldAnimate) {
    return (
      <div className="relative w-full space-y-2">
        <Progress value={progress} />
        <div className="flex justify-between text-sm text-gray-500">
          <span>
            {formatDateTimeForDisplay(lastFed, timezone)}
          </span>
          <span>
            {nextFeedingTime && formatDateTimeForDisplay(nextFeedingTime, timezone)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full space-y-2">
      <Progress value={progress} />
      <div className="flex justify-between text-sm text-gray-500">
        <span>
          {formatDateTimeForDisplay(lastFed, timezone)}
        </span>
        <span>
          {nextFeedingTime && formatDateTimeForDisplay(nextFeedingTime, timezone)}
        </span>
      </div>
    </div>
  )
}

