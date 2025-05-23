import { FeedingLog, CatType } from '@/lib/types';
import { formatDateTimeForDisplay } from '@/lib/utils/dateUtils';
import { addHours, isBefore, differenceInHours } from 'date-fns';
import { getUserTimezone, calculateNextFeeding } from '../utils/dateUtils';
import { toDate } from 'date-fns-tz';
import { BaseCat, BaseFeedingLog, ID } from '../types/common';
import { Notification } from '../types/notification';
import { 
  generateFeedingNotifications,
  isDuplicateFeeding
} from './feeding-notification-service';
import { getData, setData, delay } from './apiService';

/**
 * Busca a última alimentação de um gato
 */
export const getLastFeeding = async (catId: string): Promise<BaseFeedingLog | null> => {
  try {
    const response = await fetch(`/api/feedings/last/${catId}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Erro ao buscar última alimentação:', error);
    return null;
  }
};

/**
 * Busca um gato específico
 */
export const getCat = async (catId: string): Promise<BaseCat | null> => {
  try {
    const response = await fetch(`/api/cats/${catId}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Erro ao buscar gato:', error);
    return null;
  }
};

/**
 * Registra uma nova alimentação
 */
export const registerFeeding = async (
  catId: string,
  userId: string,
  portionSize: number,
  notes?: string
): Promise<Response> => {
  try {
    // Buscar última alimentação do gato
    const lastFeeding = await getLastFeeding(catId);
    
    // Verificar se é uma alimentação duplicada
    if (lastFeeding && isDuplicateFeeding(new Date(lastFeeding.timestamp))) {
      const cat = await getCat(catId);
      if (cat) {
        const notifications = generateFeedingNotifications(
          cat,
          new Date(),
          userId,
          new Date(lastFeeding.timestamp)
        );
        await saveNotifications(notifications);
      }
      throw new Error('Tentativa de alimentação duplicada');
    }

    // Registrar a alimentação
    const response = await fetch('/api/feedings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        catId,
        userId,
        portionSize,
        notes,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Falha ao registrar alimentação');
    }

    // Buscar informações do gato para notificação
    const cat = await getCat(catId);
    if (cat) {
      const notifications = generateFeedingNotifications(
        cat,
        new Date(),
        userId,
        lastFeeding ? new Date(lastFeeding.timestamp) : null
      );
      await saveNotifications(notifications);
    }

    return response;
  } catch (error) {
    console.error('Erro ao registrar alimentação:', error);
    throw error;
  }
};

/**
 * Atualiza o horário de alimentação de um gato
 */
export const updateFeedingSchedule = async (
  catId: string,
  userId: string,
  newSchedule: {
    type: 'interval' | 'fixedTime';
    interval?: number;
    times?: string;
  }
): Promise<Response> => {
  try {
    const response = await fetch(`/api/cats/${catId}/schedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newSchedule),
    });

    if (!response.ok) {
      throw new Error('Falha ao atualizar horário de alimentação');
    }

    // Buscar informações do gato para notificação
    const cat = await getCat(catId);
    if (cat) {
      const nextFeedingTime = await getNextFeedingTime(catId, userId);
      if (nextFeedingTime) {
        const notifications = generateFeedingNotifications(
          cat,
          nextFeedingTime,
          userId
        );
        await saveNotifications(notifications);
      }
    }

    return response;
  } catch (error) {
    console.error('Erro ao atualizar horário de alimentação:', error);
    throw error;
  }
};

/**
 * Busca a próxima alimentação de um gato via API.
 */
export const getNextFeedingTime = async (catId: string, userId?: string): Promise<Date | null> => {
  console.log(`[getNextFeedingTime] Fetching next feeding for cat: ${catId}, user: ${userId}`);
  if (!catId) {
    throw new Error('Cat ID is required');
  }

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (userId) {
    headers['X-User-ID'] = userId;
  } else {
    console.warn(`[getNextFeedingTime] User ID not provided. API call might fail authorization.`);
  }

  try {
    // Fetch directly from the dedicated API endpoint
    const response = await fetch(`/api/cats/${catId}/next-feeding`, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getNextFeedingTime] API Error (${response.status}): ${errorText}`);
      throw new Error(`Failed to fetch next feeding time: ${errorText}`);
    }
    
    const data = await response.json();
    
    // If nextFeeding is explicitly null, this is a valid state
    if (data.nextFeeding === null) {
      console.log(`[getNextFeedingTime] No next feeding time scheduled.`);
      return null;
    }
    
    // Otherwise, validate the date
    if (!data.nextFeeding || typeof data.nextFeeding !== 'string') {
      throw new Error('Invalid response format from API');
    }

    const nextDate = new Date(data.nextFeeding);
    if (isNaN(nextDate.getTime())) {
      throw new Error(`Invalid date received from API: ${data.nextFeeding}`);
    }

    console.log(`[getNextFeedingTime] Successfully fetched next feeding time: ${nextDate.toISOString()}`);
    return nextDate;

  } catch (error) {
    console.error(`[getNextFeedingTime] Error fetching next feeding for ${catId}:`, error);
    throw error; // Re-throw to propagate to useFeeding hook
  }
};

/**
 * Busca os logs de alimentação de um gato
 */
// THIS FUNCTION IS FLAWED (uses localStorage) - Needs refactoring or removal
export const getFeedingLogs = async (catId: string, userTimezone?: string): Promise<FeedingLog[]> => {
  // ... existing flawed implementation ...
  console.warn("[getFeedingLogs] THIS FUNCTION IS USING LOCALSTORAGE AND IS LIKELY INCORRECT - Needs refactoring to use API");
  // ... 
  return []; // Return empty for now
};

/**
 * Salva notificações no banco de dados
 */
const saveNotifications = async (notifications: Notification[]): Promise<void> => {
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notifications),
    });
  } catch (error) {
    console.error('Erro ao salvar notificações:', error);
  }
}; 