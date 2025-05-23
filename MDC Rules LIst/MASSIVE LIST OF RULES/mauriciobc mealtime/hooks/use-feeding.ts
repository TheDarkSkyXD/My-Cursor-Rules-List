"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
// import { useAppContext } from "@/lib/context/AppContext"; // REMOVED
import { useUserContext } from "@/lib/context/UserContext";
import { useCats } from "@/lib/context/CatsContext"; // ADDED
import { useFeeding as useFeedingContextState } from "@/lib/context/FeedingContext"; // ADDED
import { CatType, FeedingLog } from "@/lib/types";
import { BaseFeedingLogs } from "@/lib/types/common";
import { createFeedingLog, getNextFeedingTime } from "@/lib/services/apiService";
import { getRelativeTime, formatDateTimeForDisplay, getUserTimezone } from "@/lib/utils/dateUtils";
import { toast } from "sonner";
import { format, formatDistanceToNow, isBefore, addHours, parseISO, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toDate, formatInTimeZone } from "date-fns-tz";
// import { useSession } from "next-auth/react"; // No longer needed directly
import { calculateNextFeeding } from "@/lib/utils/dateUtils";
import { validate as validateUUID } from 'uuid'; // Import UUID validation
import { useRouter } from "next/navigation";

// Simple UUID function might not be needed if API generates IDs
// function uuidv4(): string { ... }

// Changed catId to string to be consistent
export function useFeeding(catId: string | null) {
  // const { state: appState, dispatch } = useAppContext(); // REMOVED
  const { state: userState } = useUserContext();
  const { state: catsState } = useCats();
  const { state: feedingState, dispatch: feedingDispatch } = useFeedingContextState();
  const { cats, isLoading: isLoadingCats, error: errorCats } = catsState;
  // const { data: session, status } = useSession(); // REMOVED (use userState)
  const router = useRouter();

  // State for specific errors within this hook instance
  const [internalError, setInternalError] = useState<string | null>(null);

  // --- ADD UUID Validation ---
  useEffect(() => {
    // Explicitly check for null/undefined before validating
    if (catId === null || catId === undefined) {
      setInternalError(null); // No ID provided is not an *invalid format* error
    } else if (!validateUUID(catId)) {
      console.error(`[useFeeding] Invalid UUID format for catId: ${catId}`);
      setInternalError("Formato de ID inválido.");
    } else {
      setInternalError(null); // Clear error if ID is valid
    }
  }, [catId]);
  // --- END UUID Validation ---

  // Log input and state
  console.log(`[useFeeding] Hook rendered for catId: ${catId}`);
  console.log(`[useFeeding] isLoadingCats: ${isLoadingCats}, errorCats: ${errorCats}`);
  console.log(`[useFeeding] Cats from context:`, cats);
  
  // Derive cat and logs from context state using useMemo
  const cat = useMemo(() => {
    console.log(`[useFeeding] useMemo executing for catId: ${catId}`);
    if (!catId || !cats) {
        console.log(`[useFeeding] useMemo returning null (missing catId or cats)`);
        return null;
    }
    // --- Fix: Compare IDs as strings --- 
    const foundCat = cats.find(c => String(c.id) === String(catId)) || null;
    console.log(`[useFeeding] Found cat in context:`, foundCat);
    if (!foundCat) {
      console.error(`[useFeeding] Cat not found in context for ID: ${catId}`);
      setInternalError("Gato não encontrado.");
    }
    return foundCat;
  }, [catId, cats]);

  const logs = useMemo(() => {
    if (!catId || !feedingState.feedingLogs) return [];
    // Logs are already sorted in context
    return feedingState.feedingLogs.filter(log => log.catId === catId);
  }, [catId, feedingState.feedingLogs]);

  // State for next feeding time specific to this cat/hook instance
  const [nextFeedingTime, setNextFeedingTime] = useState<Date | null>(null);
  const [formattedNextFeedingTime, setFormattedNextFeedingTime] = useState<string>("");
  const [formattedTimeDistance, setFormattedTimeDistance] = useState<string>("");
  const [isNextTimeLoading, setIsNextTimeLoading] = useState(false); // Loading state for next feeding time fetch
  const [nextTimeError, setNextTimeError] = useState<string | null>(null); // Error state for next feeding time fetch

  // Combined loading state from contexts
  const isLoading = isLoadingCats || feedingState.isLoading;
  // Combined error state from contexts + internal validation
  const error = internalError || errorCats || feedingState.error || nextTimeError; // Combine all error sources

  // Log combined loading/error states
  console.log(`[useFeeding] Combined isLoading: ${isLoading}, Combined error: ${error}`);

  // Memoize the function to update feeding time display
  const updateFeedingTimeDisplay = useCallback((next: Date | null) => {
    if (next) {
      // Get timezone from user context preferences
      const timezone = userState.currentUser?.preferences?.timezone || getUserTimezone(); // Fallback
      setFormattedNextFeedingTime(formatDateTimeForDisplay(next, timezone));
      setFormattedTimeDistance(getRelativeTime(next));
    } else {
      setFormattedNextFeedingTime("");
      setFormattedTimeDistance("");
    }
  }, [userState.currentUser?.preferences?.timezone]);

  // Fetch next feeding time when catId changes or cat data is available
  useEffect(() => {
    let isMounted = true;
    
    // Clear any previous errors
    setNextTimeError(null);
    
    if (!catId || !cat) {
      console.log(`[useFeeding] Skipping next feeding time fetch - no cat/id`);
      setNextFeedingTime(null);
      updateFeedingTimeDisplay(null);
      return;
    }

    if (internalError) {
      console.log(`[useFeeding] Skipping next feeding time fetch - internal error: ${internalError}`);
      return;
    }

    const fetchNextTime = async () => {
      setIsNextTimeLoading(true);
      try {
        console.log(`[useFeeding] Fetching next feeding time for cat: ${catId}`);
        const next = await getNextFeedingTime(catId, userState.currentUser?.id);
        
        if (isMounted) {
          // Handle null as a valid state
          if (next === null) {
            console.log(`[useFeeding] No next feeding time scheduled for cat: ${catId}`);
            setNextFeedingTime(null);
            updateFeedingTimeDisplay(null);
          } else {
            console.log(`[useFeeding] Received next feeding time:`, next);
            setNextFeedingTime(next);
            updateFeedingTimeDisplay(next);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          const errorMessage = err?.message || "Erro ao buscar próximo horário.";
          console.error(`[useFeeding] Error fetching next feeding time:`, errorMessage);
          
          // Only set error states for actual errors, not for "no schedule" cases
          if (!errorMessage.includes('No next feeding time available')) {
            setNextTimeError(errorMessage);
            // Only set critical errors that should trigger redirect
            if (errorMessage.includes('not found') || 
                errorMessage.includes('unauthorized') ||
                errorMessage.includes('Authentication required')) {
              setInternalError(errorMessage);
            }
          }
          
          setNextFeedingTime(null);
          updateFeedingTimeDisplay(null);
        }
      } finally {
        if (isMounted) {
          setIsNextTimeLoading(false);
        }
      }
    };

    fetchNextTime();

    return () => {
      isMounted = false;
    };
  }, [catId, cat, updateFeedingTimeDisplay, internalError, userState.currentUser?.id]);

  // Refresh relative time display every minute
  useEffect(() => {
    if (!nextFeedingTime || isNaN(nextFeedingTime.getTime())) {
      setFormattedTimeDistance("");
      return;
    }

    const interval = setInterval(() => {
      setFormattedTimeDistance(getRelativeTime(nextFeedingTime));
    }, 60000);

    // Initial set
    setFormattedTimeDistance(getRelativeTime(nextFeedingTime));

    return () => clearInterval(interval);
  }, [nextFeedingTime]);

  // Function to handle marking the cat as fed
  const handleMarkAsFed = useCallback(async (amount?: string, notes?: string, timestamp?: Date): Promise<FeedingLog> => {
    if (!cat || !userState.currentUser?.id) {
      toast.error("Não é possível registrar: dados do gato ou usuário ausentes.");
      throw new Error("Missing cat or user data"); // Throw error to indicate failure
    }
    const currentUserId = userState.currentUser.id;

    try {
      const now = timestamp || new Date();

      // Construct payload for API
      const newLogData: Omit<BaseFeedingLogs, 'id' | 'created_at' | 'updated_at'> = {
        cat_id: cat.id,
        household_id: userState.currentUser?.householdId,
        meal_type: "Normal",
        amount: amount ? parseFloat(amount) : undefined,
        unit: "g",
        notes: notes || undefined,
        fed_by: currentUserId,
        fed_at: now
      };

      // Call API to create log
      const createdLog = await createFeedingLog(newLogData, currentUserId);

      // Dispatch action to update FeedingContext state
      feedingDispatch({
        type: "ADD_FEEDING",
        // Ensure payload matches expected FeedingLog structure (with Date objects)
        payload: { 
            ...createdLog, 
            timestamp: new Date(createdLog.timestamp), 
            createdAt: new Date(createdLog.createdAt)
            // Potentially add cat/user details here if context expects enriched logs
        }
      });

      // Refetch next feeding time after logging
      const next = await getNextFeedingTime(cat.id, userState.currentUser?.id);
      const nextDate = next instanceof Date ? next : null;
      setNextFeedingTime(nextDate);
      updateFeedingTimeDisplay(nextDate);

      toast.success(`Alimentação registrada para ${cat.name}`);
      return createdLog; // Return the created log

    } catch (error: any) {
      console.error("Erro ao registrar alimentação:", error);
      toast.error(`Falha ao registrar alimentação: ${error.message}`);
      throw error; // Re-throw error so calling component knows it failed
    }
  }, [cat, userState.currentUser, feedingDispatch, updateFeedingTimeDisplay, userState.currentUser?.id]);

  // Update the useEffect that handles redirection
  useEffect(() => {
    if (!isLoading && internalError) {
      console.error(`[useFeeding] Critical error detected:`, internalError);
      throw new Error(internalError);
    }
  }, [internalError, isLoading]);

  // Return state and handlers
  return {
    cat, // Derived from context
    logs, // Derived from context
    nextFeedingTime,
    formattedNextFeedingTime,
    formattedTimeDistance,
    isLoading: isLoading || isNextTimeLoading, // Combine loading states
    error: error || nextTimeError, // Combine error states
    handleMarkAsFed,
  };
}
