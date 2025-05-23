import { Notification, NotificationType } from "@/lib/types/notification";
import { format, addHours, isBefore, isAfter, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BaseCat } from "@/lib/types/common";
import { generateNumericUUID } from "@/lib/utils/uuid";

// Constantes
const REMINDER_THRESHOLD_MINUTES = 30; // Lembrar 30 minutos antes
const LATE_THRESHOLD_MINUTES = 15; // Considerar atrasado após 15 minutos
const MISSED_THRESHOLD_MINUTES = 60; // Considerar perdida após 1 hora
const DUPLICATE_THRESHOLD_MINUTES = 5; // Limite para alimentação duplicada

interface FeedingSchedule {
  catId: string;
  nextFeedingTime: Date;
  interval: number;
}

/**
 * Cria uma notificação de alimentação
 */
export const createFeedingNotification = (
  cat: BaseCat,
  type: NotificationType,
  scheduledTime: Date,
  userId: string
): Notification => {
  const now = new Date();
  const minutesUntil = differenceInMinutes(scheduledTime, now);
  const isOverdue = isBefore(scheduledTime, now);

  let title = "";
  let message = "";
  let icon = "utensils";

  switch (type) {
    case "reminder":
      title = `Hora de alimentar ${cat.name}`;
      message = `${cat.name} deve ser alimentado às ${format(scheduledTime, "HH:mm", { locale: ptBR })}.`;
      icon = "clock";
      break;
    case "feeding":
      if (isOverdue) {
        title = `Alimentação atrasada: ${cat.name}`;
        message = `${cat.name} deveria ter sido alimentado às ${format(scheduledTime, "HH:mm", { locale: ptBR })}.`;
        icon = "alert-triangle";
      } else {
        title = `Alimentação registrada: ${cat.name}`;
        message = `${cat.name} foi alimentado às ${format(scheduledTime, "HH:mm", { locale: ptBR })}.`;
        icon = "check";
      }
      break;
    case "warning":
      if (minutesUntil <= -MISSED_THRESHOLD_MINUTES) {
        title = `Alimentação perdida: ${cat.name}`;
        message = `${cat.name} não foi alimentado no horário programado (${format(scheduledTime, "HH:mm", { locale: ptBR })}).`;
        icon = "alert-circle";
      } else {
        title = `Alimentação duplicada: ${cat.name}`;
        message = `Tentativa de alimentar ${cat.name} novamente em menos de ${DUPLICATE_THRESHOLD_MINUTES} minutos.`;
        icon = "alert-triangle";
      }
      break;
    case "system":
      title = `Horário atualizado: ${cat.name}`;
      message = `O horário de alimentação de ${cat.name} foi atualizado para ${format(scheduledTime, "HH:mm", { locale: ptBR })}.`;
      icon = "bell";
      break;
  }

  return {
    id: generateNumericUUID(),
    title,
    message,
    type,
    timestamp: new Date(),
    createdAt: new Date(),
    isRead: false,
    userId,
    catId: cat.id,
    actionUrl: `/cats/${cat.id}`,
    icon,
    data: {
      catId: cat.id,
      scheduledTime: scheduledTime.toISOString()
    }
  };
};

/**
 * Verifica se uma alimentação está duplicada
 */
export const isDuplicateFeeding = (lastFeedingTime: Date | null): boolean => {
  if (!lastFeedingTime) return false;
  
  const now = new Date();
  const minutesSinceLastFeeding = differenceInMinutes(now, lastFeedingTime);
  
  return minutesSinceLastFeeding < DUPLICATE_THRESHOLD_MINUTES;
};

/**
 * Verifica se uma alimentação está atrasada
 */
export const isFeedingLate = (scheduledTime: Date): boolean => {
  const now = new Date();
  const minutesLate = differenceInMinutes(now, scheduledTime);
  
  return minutesLate > LATE_THRESHOLD_MINUTES;
};

/**
 * Verifica se uma alimentação está perdida
 */
export const isFeedingMissed = (scheduledTime: Date): boolean => {
  const now = new Date();
  const minutesMissed = differenceInMinutes(now, scheduledTime);
  
  return minutesMissed > MISSED_THRESHOLD_MINUTES;
};

/**
 * Verifica se deve enviar um lembrete de alimentação
 */
export const shouldSendReminder = (scheduledTime: Date): boolean => {
  const now = new Date();
  const minutesUntil = differenceInMinutes(scheduledTime, now);
  
  return minutesUntil <= REMINDER_THRESHOLD_MINUTES && minutesUntil > 0;
};

/**
 * Gera notificações baseadas no status da alimentação
 */
export const generateFeedingNotifications = (
  cat: BaseCat,
  scheduledTime: Date,
  userId: string,
  lastFeedingTime: Date | null = null
): Notification[] => {
  const notifications: Notification[] = [];

  // Verificar lembrete
  if (shouldSendReminder(scheduledTime)) {
    notifications.push(createFeedingNotification(cat, "reminder", scheduledTime, userId));
  }

  // Verificar atraso
  if (isFeedingLate(scheduledTime)) {
    notifications.push(createFeedingNotification(cat, "feeding", scheduledTime, userId));
  }

  // Verificar alimentação perdida
  if (isFeedingMissed(scheduledTime)) {
    notifications.push(createFeedingNotification(cat, "warning", scheduledTime, userId));
  }

  // Verificar alimentação duplicada
  if (isDuplicateFeeding(lastFeedingTime)) {
    notifications.push(createFeedingNotification(cat, "warning", scheduledTime, userId));
  }

  return notifications;
}; 