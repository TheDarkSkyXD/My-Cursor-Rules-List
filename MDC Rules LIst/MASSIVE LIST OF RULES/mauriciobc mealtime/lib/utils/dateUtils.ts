import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { Schedule } from "../types";
import { differenceInHours, addHours, isBefore } from "date-fns";

/**
 * Get user's timezone or default to America/Sao_Paulo
 */
export function getUserTimezone(userTimezone?: string): string {
  // Se o timezone for UTC ou não for fornecido, usar America/Sao_Paulo
  if (!userTimezone || userTimezone === 'UTC') {
    console.warn('[getUserTimezone] Timezone UTC ou não fornecido, usando America/Sao_Paulo como fallback');
    return "America/Sao_Paulo";
  }

  // Validar se o timezone é válido
  try {
    Intl.DateTimeFormat(undefined, { timeZone: userTimezone });
    return userTimezone;
  } catch (error) {
    console.warn(`[getUserTimezone] Timezone ${userTimezone} inválido, usando America/Sao_Paulo como fallback`);
    return "America/Sao_Paulo";
  }
}

/**
 * Get a user-friendly age string from a birthdate
 */
export function getAgeString(birthdate?: Date, userTimezone?: string): string {
  if (!birthdate) return "Idade desconhecida";
  
  try {
    const timezone = getUserTimezone(userTimezone);
    const today = toDate(new Date(), { timeZone: timezone });
    const birth = toDate(birthdate, { timeZone: timezone });
    
    // Validar datas
    if (isNaN(today.getTime()) || isNaN(birth.getTime())) {
      console.error('Data inválida fornecida para cálculo de idade');
      return "Idade desconhecida";
    }
    
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    if (age === 0) {
      // Calcular meses para filhotes
      const monthsOld = today.getMonth() - birth.getMonth() + 
        (today.getDate() < birth.getDate() ? -1 : 0) + 
        (today.getFullYear() !== birth.getFullYear() ? 12 : 0);
      
      if (monthsOld < 0) {
        console.error('Idade negativa calculada para filhote');
        return "Idade desconhecida";
      }
      
      return `${monthsOld} ${monthsOld !== 1 ? 'meses' : 'mês'}`;
    }
    
    if (age < 0) {
      console.error('Idade negativa calculada');
      return "Idade desconhecida";
    }
    
    return `${age} ${age !== 1 ? 'anos' : 'ano'}`;
  } catch (error) {
    console.error('Erro ao calcular idade:', error);
    return "Idade desconhecida";
  }
}

/**
 * Get a user-friendly description of a feeding schedule
 */
export function getScheduleText(schedule?: Schedule): string {
  if (!schedule) return "Sem agendamento ativo";
  
  try {
    if (schedule.type === 'interval' && typeof schedule.interval === 'number' && schedule.interval > 0) {
      return `A cada ${schedule.interval} ${schedule.interval !== 1 ? 'horas' : 'hora'}`;
    } else if (schedule.type === 'fixedTime' && typeof schedule.times === 'string' && schedule.times.trim()) {
      return `Diariamente às ${schedule.times}`;
    }
    
    return "Agendamento configurado";
  } catch (error) {
    console.error('Erro ao gerar texto do agendamento:', error);
    return "Agendamento inválido";
  }
}

/**
 * Format a date for display
 */
export function formatDateTime(date: Date | string, userTimezone?: string): string {
  if (!date) return "";
  
  try {
    const timezone = getUserTimezone(userTimezone);
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      console.error('Data inválida fornecida para formatação');
      return "";
    }
    return formatInTimeZone(dateObj, timezone, "dd 'de' MMM 'às' HH:mm", { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return "";
  }
}

/**
 * Get a relative time (e.g., "3 hours ago", "in 5 minutes")
 */
export function getRelativeTime(date: Date | string | null | undefined, userTimezone?: string): string {
  if (!date) return "";
  
  try {
    const timezone = getUserTimezone(userTimezone);
    const dateObj = typeof date === 'string' ? toDate(new Date(date), { timeZone: timezone }) : date;
    if (isNaN(dateObj.getTime())) {
      console.error('Data inválida fornecida para tempo relativo');
      return "";
    }
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
  } catch (error) {
    console.error('Erro ao calcular tempo relativo:', error);
    return "";
  }
}

/**
 * Parse a time string into a Date object
 */
export function parseTimeString(timeString: string, userTimezone?: string): Date {
  try {
    const timezone = getUserTimezone(userTimezone);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Validar formato do horário
    if (isNaN(hours) || isNaN(minutes) || 
        hours < 0 || hours > 23 || 
        minutes < 0 || minutes > 59) {
      throw new Error(`Formato de horário inválido: ${timeString}`);
    }
    
    const date = toDate(new Date(), { timeZone: timezone });
    date.setHours(hours, minutes, 0, 0);
    
    if (isNaN(date.getTime())) {
      throw new Error(`Data inválida criada para: ${timeString}`);
    }
    
    return date;
  } catch (error) {
    console.error(`Erro ao processar horário ${timeString}:`, error);
    return new Date(); // Retorna hora atual em caso de erro
  }
}

/**
 * Get the next scheduled feed time from a time-based schedule
 */
export function getNextScheduledTime(schedule: Schedule, userTimezone?: string): Date | null {
  if (!schedule || !schedule.enabled) return null;
  
  try {
    const timezone = getUserTimezone(userTimezone);
    const now = toDate(new Date(), { timeZone: timezone });
    if (isNaN(now.getTime())) {
      console.error('Data atual inválida');
      return null;
    }
    
    const today = toDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()), { timeZone: timezone });
    
    if (schedule.type === 'interval' && typeof schedule.interval === 'number' && schedule.interval > 0) {
      // Para agendamentos baseados em intervalo
      const lastFeeding = schedule.status === 'completed' ? now : today;
      const nextTime = toDate(new Date(lastFeeding.getTime() + schedule.interval * 60 * 60 * 1000), { timeZone: timezone });
      
      if (isNaN(nextTime.getTime())) {
        console.error('Data inválida calculada para próximo horário');
        return null;
      }
      
      return nextTime;
    } else if (schedule.type === 'fixedTime' && typeof schedule.times === 'string' && schedule.times.trim()) {
      // Para agendamentos em horários fixos
      try {
        const [hours, minutes] = schedule.times.split(':').map(Number);
        
        // Validar formato do horário
        if (isNaN(hours) || isNaN(minutes) || 
            hours < 0 || hours > 23 || 
            minutes < 0 || minutes > 59) {
          throw new Error(`Formato de horário inválido: ${schedule.times}`);
        }
        
        const timeToday = toDate(new Date(today), { timeZone: timezone });
        timeToday.setHours(hours, minutes);
        
        if (isNaN(timeToday.getTime())) {
          throw new Error(`Data inválida criada para: ${schedule.times}`);
        }
        
        // Se este horário já passou hoje, agendar para amanhã
        if (timeToday < now) {
          timeToday.setDate(timeToday.getDate() + 1);
        }
        
        return timeToday;
      } catch (error) {
        console.error(`Erro ao processar horário ${schedule.times}:`, error);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao calcular próximo horário programado:', error);
    return null;
  }
}

/**
 * Calcula o próximo horário de alimentação baseado no último horário e intervalo
 */
export function calculateNextFeeding(lastFeedingTime: Date, interval: number, userTimezone: string, source: 'schedule' | 'cat' = 'cat'): Date {
  // Validar intervalo
  if (!interval || interval <= 0) {
    console.error(`[calculateNextFeeding] Intervalo inválido (${interval}) fornecido por ${source}`);
    interval = 8; // Usar valor padrão em caso de erro
  }

  // Garantir que estamos usando o timezone correto
  const timezone = getUserTimezone(userTimezone);
  
  // Converter última alimentação para UTC
  const lastFeedingUTC = toDate(lastFeedingTime, { timeZone: timezone });
  const nowUTC = new Date();
  nowUTC.setMilliseconds(0);
  
  console.log('\n[calculateNextFeeding] Iniciando cálculo:');
  console.log('- Última alimentação (UTC):', lastFeedingUTC.toISOString());
  console.log('- Intervalo:', interval, 'horas (fonte:', source, ')');
  console.log('- Horário atual (UTC):', nowUTC.toISOString());
  console.log('- Timezone do usuário:', timezone);

  // Calcular próxima alimentação em UTC
  let nextFeedingUTC = new Date(lastFeedingUTC);
  nextFeedingUTC.setHours(nextFeedingUTC.getHours() + interval);
  console.log('- Próxima alimentação inicial (UTC):', nextFeedingUTC.toISOString());

  // Se o horário calculado já passou, continuar adicionando intervalos até encontrar um horário futuro
  while (nextFeedingUTC < nowUTC) {
    console.log('- Horário calculado já passou, adicionando mais um intervalo');
    nextFeedingUTC.setHours(nextFeedingUTC.getHours() + interval);
    console.log('- Nova tentativa (UTC):', nextFeedingUTC.toISOString());
  }

  console.log('- Horário final calculado (UTC):', nextFeedingUTC.toISOString());
  
  // Converter para o timezone do usuário
  try {
    const nextFeedingLocal = toDate(nextFeedingUTC, { timeZone: timezone });
    console.log('- Horário convertido para local:', nextFeedingLocal.toISOString());
    
    // Formatar no timezone local
    const formattedLocal = formatInTimeZone(nextFeedingLocal, timezone, 'yyyy-MM-dd HH:mm:ss');
    console.log('- Horário final em local time:', formattedLocal);
    
    // Verificar se a conversão foi bem sucedida
    const offset = nextFeedingLocal.getTime() - nextFeedingUTC.getTime();
    console.log('- Offset em milissegundos:', offset);
    console.log('- Offset em horas:', offset / (1000 * 60 * 60));

    return nextFeedingLocal;
  } catch (error) {
    console.error('Erro ao converter timezone:', error);
    return nextFeedingUTC; // Retornar UTC em caso de erro
  }
}

/**
 * Format a date for display in user's timezone
 */
export function formatDateTimeForDisplay(date: Date | string, userTimezone: string): string {
  try {
    // Garante que a data está em UTC
    const utcDate = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(utcDate.getTime())) {
      console.error('Data inválida fornecida para formatação');
      return "Horário não disponível";
    }

    // Converte para o timezone do usuário
    const localDate = toDate(utcDate, { timeZone: userTimezone });
    
    // Formata a data no timezone local
    return formatInTimeZone(localDate, userTimezone, "dd 'de' MMM 'às' HH:mm", { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return "Horário não disponível";
  }
}

/**
 * Calculate the next feeding time based on schedules and last feeding time
 */
export function calculateNextFeedingTime(
  schedules: { type: string; interval: number | null; times: string | null; enabled: boolean }[],
  lastFeedingTime: Date | null,
  userTimezone?: string
): Date | null {
  if (!schedules || !Array.isArray(schedules)) {
    console.log('[calculateNextFeedingTime] No schedules provided');
    return null;
  }

  const timezone = getUserTimezone(userTimezone);
  const now = toDate(new Date(), { timeZone: timezone });

  // Filter enabled schedules
  const enabledSchedules = schedules.filter(s => s.enabled);
  if (enabledSchedules.length === 0) {
    console.log('[calculateNextFeedingTime] No enabled schedules found');
    return null;
  }

  let nextFeedingTime: Date | null = null;

  // Process each schedule type
  enabledSchedules.forEach(schedule => {
    let scheduleNextTime: Date | null = null;

    try {
      if (schedule.type === 'fixed' && schedule.times) {
        // Handle fixed time schedule
        const timeStrings = schedule.times.split(',');
        const todayTimes = timeStrings.map(timeStr => {
          const [hours, minutes] = timeStr.trim().split(':').map(Number);
          const time = toDate(new Date(), { timeZone: timezone });
          time.setHours(hours, minutes, 0, 0);
          return time;
        });

        // Find the next time that hasn't passed yet
        const futureTime = todayTimes.find(time => time > now);
        if (futureTime) {
          scheduleNextTime = futureTime;
        } else {
          // If all times today have passed, use the first time tomorrow
          const tomorrowTime = toDate(todayTimes[0], { timeZone: timezone });
          tomorrowTime.setDate(tomorrowTime.getDate() + 1);
          scheduleNextTime = tomorrowTime;
        }
      } else if (schedule.type === 'interval' && schedule.interval) {
        // Handle interval schedule
        if (lastFeedingTime) {
          scheduleNextTime = calculateNextFeeding(lastFeedingTime, schedule.interval, timezone, 'schedule');
        } else {
          // If no last feeding, start from now
          scheduleNextTime = addHours(now, schedule.interval);
        }
      }
    } catch (error) {
      console.error(`[calculateNextFeedingTime] Error processing schedule: ${error}`);
    }

    // Update nextFeedingTime if this schedule is sooner
    if (scheduleNextTime && (!nextFeedingTime || scheduleNextTime < nextFeedingTime)) {
      nextFeedingTime = scheduleNextTime;
    }
  });

  if (nextFeedingTime) {
    console.log(`[calculateNextFeedingTime] Calculated next feeding time: ${nextFeedingTime.toISOString()}`);
  } else {
    console.log('[calculateNextFeedingTime] Could not calculate next feeding time');
  }

  return nextFeedingTime;
}
