import React, { createContext, useContext, useReducer, ReactNode, useMemo, useEffect, useRef, useCallback } from 'react';
import { useUserContext } from './UserContext'; // Need householdId
import { useLoading } from './LoadingContext';
import { toast } from 'sonner';
import { FeedingLog } from "@/lib/types"; // Use the existing detailed FeedingLog type
import { CatType } from "@/lib/types";
import { useCats } from './CatsContext'; // Needed for chart selector
import { format, startOfDay, isEqual, addHours, isBefore, compareAsc, endOfDay, subDays, compareDesc } from 'date-fns'; // Date helpers
import { toDate } from 'date-fns-tz'; // Import toDate for timezone-aware conversion
import { useScheduleContext } from './ScheduleContext'; // Fixed import name
import { getUserTimezone } from "../utils/dateUtils"; // Import timezone utility
import { useUserContext as useUserContextLib } from "@/lib/context/UserContext"
import { resolveDateFnsLocale } from "@/lib/utils/dateFnsLocale"

// Remove the simple Feeding interface, use FeedingLog from types.ts
// interface Feeding {
//   id: string;
//   catId: string;
//   time: string;
//   amount: number;
// }

interface FeedingState {
  feedingLogs: FeedingLog[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FeedingState = {
  feedingLogs: [],
  isLoading: false,
  error: null,
};

interface FeedingAction {
  type: 'FETCH_START' | 'FETCH_SUCCESS' | 'FETCH_ERROR' | 'ADD_FEEDING' | 'REMOVE_FEEDING' | 'UPDATE_FEEDING'; // Removed SYNC_STATE
  payload?: FeedingLog[] | FeedingLog | string; // Adjusted payload types
}

function feedingReducer(state: FeedingState, action: FeedingAction): FeedingState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, isLoading: false, feedingLogs: action.payload as FeedingLog[], error: null };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload as string };
    case 'ADD_FEEDING':
      // Add logic to sort by timestamp? Or handle in selector?
      return { ...state, feedingLogs: [...state.feedingLogs, action.payload as FeedingLog] };
    case 'REMOVE_FEEDING':
      return { ...state, feedingLogs: state.feedingLogs.filter(log => log.id !== (action.payload as FeedingLog).id) };
    case 'UPDATE_FEEDING':
      return {
        ...state,
        feedingLogs: state.feedingLogs.map(log =>
          log.id === (action.payload as FeedingLog).id ? { ...log, ...(action.payload as FeedingLog) } : log
        ),
      };
    // case 'SYNC_STATE': // Replaced by fetch actions
    //   return action.payload as FeedingState;
    default:
      return state;
  }
}

const FeedingContext = createContext<{
  state: FeedingState;
  dispatch: React.Dispatch<FeedingAction>;
}>({ state: initialState, dispatch: () => null });

// Helper function to calculate average portion size
const selectAveragePortionSize = (logs: FeedingLog[] | null): number | null => {
  if (!logs || logs.length === 0) {
    return null;
  }
  const validPortionLogs = logs.filter(
    (log) => typeof log.portionSize === 'number' && log.portionSize > 0
  );
  if (validPortionLogs.length === 0) {
    return null;
  }
  const totalPortion = validPortionLogs.reduce(
    (sum, log) => sum + log.portionSize!, // Non-null assertion safe due to filter
    0
  );
  return totalPortion / validPortionLogs.length;
};

export const FeedingProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(feedingReducer, initialState);
  const { state: userState } = useUserContext();
  const { currentUser } = userState;
  const { addLoadingOperation, removeLoadingOperation } = useLoading();
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingIdRef = useRef<string | null>(null);
  const hasAttemptedLoadRef = useRef(false);
  const { state: userStateLib } = useUserContextLib();
  const userLanguage = userStateLib.currentUser?.preferences?.language;
  const userLocale = resolveDateFnsLocale(userLanguage);

  const cleanupLoading = useCallback(() => {
    if (loadingIdRef.current) {
      try {
        removeLoadingOperation(loadingIdRef.current);
      } catch (error) {
        console.error('[FeedingProvider] Error cleaning up loading:', error);
      } finally {
        loadingIdRef.current = null;
      }
    }
  }, [removeLoadingOperation]);

  useEffect(() => {
    hasAttemptedLoadRef.current = false;
  }, [currentUser?.householdId]);

  useEffect(() => {
    const loadingId = 'feedings-data-load';
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    let isMounted = true;

    const loadFeedingsData = async () => {
      const householdId = currentUser?.householdId;
      if (!householdId || !isMounted || hasAttemptedLoadRef.current) {
        if (!householdId) {
          dispatch({ type: 'FETCH_SUCCESS', payload: [] });
        }
        return;
      }

      hasAttemptedLoadRef.current = true;

      try {
        loadingIdRef.current = loadingId;
        dispatch({ type: 'FETCH_START' });
        addLoadingOperation({ id: loadingId, priority: 4, description: 'Carregando histórico de alimentação...' });

        console.log("[FeedingProvider] Loading feedings for household:", householdId);
        // Ensure the user ID is included for the API route's auth check
        const headers: HeadersInit = {};
        if (currentUser?.id) {
          headers['X-User-ID'] = currentUser.id;
        } else {
           // Handle case where user ID might not be available yet?
           // For now, proceed without it, API should return 401 if needed.
           console.warn("[FeedingProvider] User ID not available when fetching feedings.");
        }

        const response = await fetch(`/api/feedings?householdId=${householdId}`, {
          signal: abortController.signal,
          headers: headers // Add the headers here
        });

        if (!isMounted) return;

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[FeedingProvider] Feedings response error:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`Erro ao carregar alimentações (${response.status}): ${errorText || 'Unknown error'}`);
        }

        const rawFeedingsData: any[] = await response.json(); // Get raw data

        if (!isMounted) return;

        console.log("[FeedingProvider] Raw feedings loaded:", rawFeedingsData.length);

        // Add debug logging for data conversion
        console.log("[FeedingProvider] Sample raw feeding data:", rawFeedingsData[0]);

        // --- Mapping Logic ---
        const mappedFeedingsData: FeedingLog[] = rawFeedingsData.map(meal => {
          const convertedAmount = typeof meal.amount === 'string' ? parseFloat(meal.amount) : meal.amount;
          console.log("[FeedingProvider] Amount conversion:", {
            original: meal.amount,
            converted: convertedAmount,
            type: typeof convertedAmount
          });

          return {
            id: meal.id, // Already string UUID
            catId: meal.cat_id, // Map cat_id (string UUID)
            userId: meal.fed_by, // Map fed_by (string UUID)
            timestamp: new Date(meal.fed_at), // Map fed_at to Date object
            amount: convertedAmount, // Use converted amount
            portionSize: convertedAmount, // Also use converted amount for portionSize
            notes: meal.notes, // Map notes
            mealType: meal.meal_type, // Map meal_type
            householdId: meal.household_id, // Map household_id
            // Set relations based on API response
            user: {
              id: meal.fed_by,
              name: meal.feeder?.full_name ?? null, // Use optional chaining and nullish coalescing
              avatar: meal.feeder?.avatar_url ?? null,
            },
            cat: undefined, // Explicitly set cat as undefined
            // Set status and createdAt to undefined or handle differently if needed
            status: undefined, // Map meal_type to status if required later
            createdAt: undefined, // Not provided by this endpoint
          };
        });

        console.log("[FeedingProvider] First mapped feeding data:", mappedFeedingsData[0]);

        // Sort the *mapped* data
        const sortedData = mappedFeedingsData.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        console.log("[FeedingProvider] Successfully fetched, mapped, and sorted feeding logs:", sortedData);
        // Dispatch the mapped data
        dispatch({ type: 'FETCH_SUCCESS', payload: sortedData });

      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('[FeedingProvider] Request aborted');
          return;
        }

        if (!isMounted) return;

        console.error("[FeedingProvider] Error loading feedings data:", error);
        const errorMessage = error.message || 'Falha ao carregar histórico de alimentação';
        dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
        toast.error(errorMessage);
      } finally {
        if (isMounted) {
          cleanupLoading();
        }
      }
    };

    loadFeedingsData();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      cleanupLoading();
    };
  }, [currentUser?.householdId, addLoadingOperation, cleanupLoading]);

  const contextValue = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <FeedingContext.Provider value={contextValue}>
      {children}
    </FeedingContext.Provider>
  );
};

export const useFeeding = () => useContext(FeedingContext);

// --- Selectors --- 

/**
 * Selects the count of feeding logs recorded today.
 */
export const useSelectTodayFeedingCount = (): number => {
  const { state } = useFeeding();
  const { feedingLogs, isLoading } = state;

  return useMemo(() => {
    if (isLoading || !feedingLogs || feedingLogs.length === 0) {
      return 0;
    }
    const today = startOfDay(new Date());
    return feedingLogs.filter(log => isEqual(startOfDay(new Date(log.timestamp)), today)).length;
  }, [feedingLogs, isLoading]);
};

/**
 * Selects the most recent feeding log, potentially enriched with Cat and User details.
 */
export const useSelectLastFeedingLog = (): FeedingLog | null => {
  const { state: feedingState } = useFeeding();
  const { state: catsState } = useCats(); // Need cats to enrich the log
  const { state: userState } = useUserContext(); // Need user potentially

  const { feedingLogs, isLoading: isLoadingFeedings } = feedingState;
  const { cats, isLoading: isLoadingCats } = catsState;
  const { currentUser } = userState; // Get the full currentUser for potential enrichment

  return useMemo(() => {
    if (isLoadingFeedings || isLoadingCats || !feedingLogs || feedingLogs.length === 0 || !cats) {
      return null;
    }
    // Logs are already sorted descending by timestamp in the provider fetch
    const lastLog = feedingLogs[0]; // This log already has the simplified user: { id, name, avatar }
    if (!lastLog) return null;

    // Find the corresponding cat from the CatsContext state
    const cat = cats.find(c => c.id === lastLog.catId);
    // If we can't find the cat, return null to show loading state
    if (!cat) return null;

    // Enrich the log object by adding the found cat.
    // The user object from the initial mapping is sufficient.
    const enrichedLog: FeedingLog = {
      ...lastLog, // Contains the log with simplified user { id, name, avatar }
      timestamp: new Date(lastLog.timestamp), // Ensure Date object
      // createdAt might be undefined from the API, handle appropriately
      createdAt: lastLog.createdAt ? new Date(lastLog.createdAt) : undefined, 
      cat: cat, // Add the full cat object found in CatsContext state
      // No need to overwrite the user object here, the one from mapping is fine.
      user: lastLog.user // Ensure the user field is present (guaranteed by mapping)
    };
    
    return enrichedLog;

  }, [feedingLogs, isLoadingFeedings, cats, isLoadingCats, currentUser]);
};

/**
 * Selects data formatted for the recent feedings bar chart.
 */
export const useSelectRecentFeedingsChartData = (): any[] => {
  const { state: feedingState } = useFeeding();
  const { state: catsState } = useCats();

  const { feedingLogs, isLoading: isLoadingFeedings } = feedingState;
  const { cats, isLoading: isLoadingCats } = catsState;

  return useMemo(() => {
    if (isLoadingFeedings || isLoadingCats || !feedingLogs || !cats) {
      return [];
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return startOfDay(date); // Use startOfDay for consistent comparison
    }).reverse();

    const recentData = last7Days.map(date => {
      const dayLogs = feedingLogs.filter(log => isEqual(startOfDay(new Date(log.timestamp)), date));

      const catData = cats.reduce((acc, cat) => {
        const catLogs = dayLogs.filter(log => log.catId === cat.id);
        const totalFood = catLogs.reduce((sum, log) => sum + (log.portionSize || 0), 0);
        return {
          ...acc,
          [cat.id]: totalFood // Use cat id as key for the chart
        };
      }, {} as Record<string, number>);

      return {
        name: format(date, 'EEE'), // Format day name
        ...catData
      };
    });

    return recentData;
  }, [feedingLogs, isLoadingFeedings, cats, isLoadingCats]);
};

// --- New Selector --- 

interface UpcomingFeeding {
  id: string; // Unique ID for list key
  catId: string; // Changed from ID
  catName: string;
  catPhoto: string | null;
  nextFeeding: Date;
  isOverdue: boolean;
}

/**
 * Selects the next 5 upcoming or overdue feeding times for the current household.
 */
export const useSelectUpcomingFeedings = (limit: number = 5): UpcomingFeeding[] => {
  const { state: catsState } = useCats();
  const { state: feedingState } = useFeeding();
  const { state: schedulesState } = useScheduleContext(); // Use assumed SchedulesContext
  const { state: userState } = useUserContext();

  const { cats, isLoading: isLoadingCats } = catsState;
  const { feedingLogs, isLoading: isLoadingFeedings } = feedingState;
  const { schedules, isLoading: isLoadingSchedules } = schedulesState;
  const { currentUser, isLoading: isLoadingUser } = userState;
  const timezone = useMemo(() => getUserTimezone(currentUser?.preferences?.timezone), [currentUser?.preferences?.timezone]);

  return useMemo(() => {
    // Ensure all required data is loaded and available
    if (isLoadingCats || isLoadingFeedings || isLoadingSchedules || isLoadingUser || 
        !currentUser?.householdId || !cats || !feedingLogs || !schedules) {
      return []; // Return empty if still loading or data missing
    }

    try {
      const now = toDate(new Date(), { timeZone: timezone });
      const householdCats = cats.filter(cat => String(cat.householdId) === String(currentUser.householdId));
      
      // Pre-filter logs and schedules for efficiency if datasets are large
      const householdLogs = feedingLogs.filter(log => householdCats.some(cat => cat.id === log.catId));
      const householdSchedules = schedules.filter(sch => householdCats.some(cat => cat.id === sch.catId));
      
      // Pre-compute last log for each cat
      const lastLogMap = new Map<string, FeedingLog>();
      householdLogs.sort((a, b) => compareAsc(new Date(b.timestamp), new Date(a.timestamp))); // Sort once
      householdLogs.forEach(log => {
          if (!lastLogMap.has(log.catId)) {
              lastLogMap.set(log.catId, log);
          }
      });

      const calculatedFeedings: UpcomingFeeding[] = [];

      householdCats.forEach((cat) => {
        const catSchedules = householdSchedules.filter(sch => sch.catId === cat.id);
        const lastFeedingLog = lastLogMap.get(cat.id);
        const lastFeeding = lastFeedingLog ? new Date(lastFeedingLog.timestamp) : null;

        let nextFeedingTime: Date | null = null;

        // 1. Check Fixed Time Schedules
        const fixedSchedules = catSchedules.filter(sch => sch.type === 'fixedTime' && sch.times && sch.times.length > 0);
        if (fixedSchedules.length > 0) {
          let earliestNextFixed: Date | null = null;
          fixedSchedules.forEach(schedule => {
            // Ensure schedule.times is treated as an array
            const times = Array.isArray(schedule.times) ? schedule.times : schedule.times.split(',');
            times.forEach(time => {
              const [hours, minutes] = time.trim().split(':').map(Number);
              if (isNaN(hours) || isNaN(minutes)) return;

              const scheduledToday = toDate(new Date(now), { timeZone: timezone });
              scheduledToday.setHours(hours, minutes, 0, 0);

              let scheduledDateTime = scheduledToday;
              // If the calculated time today is in the past, schedule for tomorrow
              if (isBefore(scheduledDateTime, now)) {
                scheduledDateTime = new Date(scheduledToday.setDate(scheduledToday.getDate() + 1));
              }

              // Keep the earliest upcoming fixed time
              if (!earliestNextFixed || isBefore(scheduledDateTime, earliestNextFixed)) {
                earliestNextFixed = scheduledDateTime;
              }
            });
          });
          nextFeedingTime = earliestNextFixed;
        }

        // 2. Check Interval Schedules (if no fixed time found yet)
        if (!nextFeedingTime) {
          const intervalSchedules = catSchedules.find(sch => sch.type === 'interval' && sch.interval && sch.interval > 0);
          if (intervalSchedules && intervalSchedules.interval) {
            if (lastFeeding) {
              nextFeedingTime = calculateNextFeeding(lastFeeding, intervalSchedules.interval, timezone);
            } else {
              // If never fed, schedule based on now + interval (or base on a default time?)
              nextFeedingTime = addHours(now, intervalSchedules.interval); 
            }
          }
        }

        // 3. Check Default Cat Interval (if no schedules found)
        const feedingIntervalNum = Number(cat.feeding_interval);
        if (!nextFeedingTime && feedingIntervalNum && !isNaN(feedingIntervalNum) && feedingIntervalNum > 0) {
          if (lastFeeding) {
            nextFeedingTime = calculateNextFeeding(lastFeeding, feedingIntervalNum, timezone);
          } else {
            // If never fed, schedule based on now + interval
            nextFeedingTime = addHours(now, feedingIntervalNum);
          }
        }
        
        // Add to list if a valid time was calculated
        if (nextFeedingTime) {
          calculatedFeedings.push({
            id: `cat-${cat.id}-next-${nextFeedingTime.toISOString()}`, // More unique key
            catId: cat.id,
            catName: cat.name,
            catPhoto: cat.photo_url || null,
            nextFeeding: nextFeedingTime,
            isOverdue: isBefore(nextFeedingTime, now) // Check if overdue compared to current time
          });
        }
      });

      // Sort all calculated times and take the top N
      calculatedFeedings.sort((a, b) => compareAsc(a.nextFeeding, b.nextFeeding));
      return calculatedFeedings.slice(0, limit);
      
    } catch (error) {
      console.error("useSelectUpcomingFeedings: Error calculating feedings:", error);
      return []; // Return empty array on error
    }

  }, [
    cats, isLoadingCats, 
    feedingLogs, isLoadingFeedings, 
    schedules, isLoadingSchedules, 
    currentUser, isLoadingUser, 
    timezone, 
    limit
  ]);
};

// Selector hook remains useful
export const useFeedingSelector = <T, >(selector: (state: FeedingState) => T): T => {
  const { state } = useFeeding();
  return selector(state);
};

// Selector hook for average portion size
export const useSelectAveragePortionSize = (): number | null => {
  const { state } = useFeeding();
  return useMemo(() => selectAveragePortionSize(state.feedingLogs), [state.feedingLogs]);
};

// --- Helper Functions ---

/**
 * Calculates the next feeding time by adding the interval (in hours) to the last feeding, respecting timezone.
 */
function calculateNextFeeding(lastFeeding: Date, interval: number, timezone: string): Date {
  // Add interval hours to lastFeeding, then convert to the user's timezone
  const next = addHours(lastFeeding, interval);
  return toDate(next, { timeZone: timezone });
}