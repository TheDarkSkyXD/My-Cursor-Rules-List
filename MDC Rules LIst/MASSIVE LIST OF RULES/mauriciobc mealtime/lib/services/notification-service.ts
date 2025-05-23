import { Notification, NotificationType, CreateNotificationPayload } from "@/lib/types/notification";
import { v4 as uuidv4 } from "uuid";
import { format, addHours, isBefore, isAfter, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

// Constantes
const REMINDER_THRESHOLD_MINUTES = 30; // Lembrar 30 minutos antes da alimentação agendada
const LATE_THRESHOLD_MINUTES = 15; // Considerar atrasado após 15 minutos

// Interface para o gato
interface Cat {
  id: string;
  name: string;
  photoUrl: string | null;
}

// Interface para o agendamento
interface Schedule {
  id: string;
  catId: string;
  type: "interval" | "fixedTime";
  interval: number;
  times: string;
  overrideUntil: Date | null;
  cat: Cat;
}

/**
 * Cria uma notificação de alimentação pendente
 */
export const createFeedingNotification = (cat: Cat, scheduledTime: Date): Notification => {
  const now = new Date();
  const minutesUntil = differenceInMinutes(scheduledTime, now);
  const isOverdue = isBefore(scheduledTime, now);

  let title = "";
  let message = "";
  let type: NotificationType = "feeding";

  if (isOverdue) {
    // Notificação de alimentação atrasada
    title = `Alimentação atrasada: ${cat.name}`;
    message = `${cat.name} deveria ter sido alimentado às ${format(scheduledTime, "HH:mm", { locale: ptBR })}.`;
    type = "feeding";
  } else if (minutesUntil <= REMINDER_THRESHOLD_MINUTES) {
    // Lembrete de alimentação próxima
    title = `Hora de alimentar ${cat.name}`;
    message = `${cat.name} deve ser alimentado às ${format(scheduledTime, "HH:mm", { locale: ptBR })}.`;
    type = "reminder";
  }

  return {
    id: uuidv4(),
    title,
    message,
    type,
    isRead: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    userId: "", // Será definido pelo contexto do usuário (UUID string)
    metadata: {
      catId: cat.id,
      scheduledTime: scheduledTime.toISOString()
    }
  };
};

/**
 * Gera notificações a partir dos agendamentos
 */
export const generateNotificationsFromSchedules = (schedules: Schedule[]): Notification[] => {
  const now = new Date();
  const notifications: Notification[] = [];

  schedules.forEach(schedule => {
    let nextFeedingTime: Date | null = null;

    if (schedule.type === "interval") {
      // Para agendamentos baseados em intervalo
      nextFeedingTime = addHours(now, schedule.interval);
    } else if (schedule.type === "fixedTime") {
      // Para agendamentos de horário fixo
      const times = schedule.times.split(",");
      const timesList = times.map(time => {
        const [hours, minutes] = time.split(":").map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        
        // Se o horário já passou hoje, agendar para amanhã
        if (isBefore(date, now)) {
          date.setDate(date.getDate() + 1);
        }
        
        return date;
      });
      
      // Ordenar para encontrar o próximo horário
      timesList.sort((a, b) => a.getTime() - b.getTime());
      nextFeedingTime = timesList[0];
    }

    if (nextFeedingTime) {
      // Verificar se está dentro do limite para notificação
      const minutesUntil = differenceInMinutes(nextFeedingTime, now);
      
      if (minutesUntil <= REMINDER_THRESHOLD_MINUTES || minutesUntil <= -LATE_THRESHOLD_MINUTES) {
        notifications.push(createFeedingNotification(schedule.cat, nextFeedingTime));
      }
    }
  });

  return notifications;
};

/**
 * Verifica notificações e retorna novas notificações
 */
export const checkForNewNotifications = async (): Promise<Notification[]> => {
  try {
    // Sempre verificar se estamos em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('Ambiente de desenvolvimento detectado, desativando verificação de notificações');
      return [];
    }
    
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/schedules` : '/api/schedules';
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      // Tratar respostas de erro comuns
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        return [];
      }
      
      if (!response.ok) {
        console.warn(`Erro na API de agendamentos: ${response.status}`);
        return [];
      }
      
      // Verificar tipo de conteúdo antes de processar JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return [];
      }
      
      const schedules = await response.json();
      
      if (!Array.isArray(schedules)) {
        return [];
      }
      
      return generateNotificationsFromSchedules(schedules);
    } catch (fetchError) {
      console.warn('Erro ao buscar agendamentos:', fetchError);
      return [];
    }
  } catch (error) {
    console.warn("Erro ao verificar notificações:", error);
    return [];
  }
}; 