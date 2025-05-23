"use client";

import React, { createContext, useContext, useReducer, ReactNode, Dispatch, useCallback, useEffect, useRef, useMemo } from "react";
import { Schedule } from "@/lib/types"; // Assuming Schedule type is defined here
// Import API service functions if needed for fetching/mutating schedules
// import { getSchedules, addSchedule, updateSchedule, deleteSchedule } from "@/lib/services/scheduleService";
import { useLoading } from "./LoadingContext"; // If schedule operations should trigger loading indicators
import { useUserContext } from "./UserContext"; // Need user/household context
import { toast } from "sonner"; // For error feedback

// Define state type
interface ScheduleState {
  schedules: Schedule[];
  isLoading: boolean;
  error: string | null;
}

// Define action types
type ScheduleAction =
  | { type: "FETCH_START" }
  | { type: "SET_SCHEDULES"; payload: Schedule[] }
  | { type: "ADD_SCHEDULE"; payload: Schedule }
  | { type: "UPDATE_SCHEDULE"; payload: Schedule }
  | { type: "DELETE_SCHEDULE"; payload: string } // Assuming ID is string UUID
  | { type: "FETCH_ERROR"; payload: string | null }; // Renamed from SET_ERROR, payload is error message

// Initial state
const initialState: ScheduleState = {
  schedules: [],
  isLoading: false, // Start as false, FETCH_START will set it
  error: null,
};

// Create reducer
const scheduleReducer = (state: ScheduleState, action: ScheduleAction): ScheduleState => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };
    case "SET_SCHEDULES":
      return { ...state, schedules: action.payload, isLoading: false, error: null };
    case "ADD_SCHEDULE":
      // Avoid adding duplicates if necessary
      if (state.schedules.some(s => s.id === action.payload.id)) return state;
      return { ...state, schedules: [...state.schedules, action.payload] };
    case "UPDATE_SCHEDULE":
      return {
        ...state,
        schedules: state.schedules.map((schedule) =>
          schedule.id === action.payload.id ? action.payload : schedule
        ),
      };
    case "DELETE_SCHEDULE":
      return {
        ...state,
        schedules: state.schedules.filter((schedule) => schedule.id !== action.payload),
      };
    case "FETCH_ERROR": // Renamed from SET_ERROR
      return { ...state, isLoading: false, error: action.payload }; // Stop loading on error
    default:
      return state;
  }
};

// Create context
interface ScheduleContextType {
  state: ScheduleState;
  dispatch: Dispatch<ScheduleAction>;
  // Add specific action functions if preferred over exposing dispatch directly
  // fetchSchedules: () => Promise<void>;
  // addSchedule: (scheduleData: Omit<Schedule, 'id'>) => Promise<void>;
  // updateSchedule: (scheduleData: Schedule) => Promise<void>;
  // deleteSchedule: (id: string) => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// Create hook to use context
export function useScheduleContext() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error("useScheduleContext must be used within a ScheduleProvider");
  }
  return context;
}

// Create provider
export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(scheduleReducer, initialState);
  const { state: userState } = useUserContext();
  const { currentUser } = userState;
  const { addLoadingOperation, removeLoadingOperation } = useLoading();
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingIdRef = useRef<string | null>(null);
  const hasAttemptedLoadRef = useRef(false);

  const cleanupLoading = useCallback(() => {
    if (loadingIdRef.current) {
      try {
        removeLoadingOperation(loadingIdRef.current);
      } catch (error) {
        console.error('[ScheduleProvider] Error cleaning up loading:', error);
      } finally {
        loadingIdRef.current = null;
      }
    }
  }, [removeLoadingOperation]);

  // Reset load attempt flag when household changes
  useEffect(() => {
    hasAttemptedLoadRef.current = false;
  }, [currentUser?.householdId]);

  // Fetch initial schedules based on household ID
  useEffect(() => {
    const loadingId = "schedule-load";
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    let isMounted = true;

    const loadSchedules = async () => {
      const householdId = currentUser?.householdId;
      const userId = currentUser?.id;

      if (!householdId || !isMounted || hasAttemptedLoadRef.current) {
        if (!householdId) {
          // If no household, ensure schedules are empty - defer dispatch
          queueMicrotask(() => {
             if (isMounted) { // Check mount status again inside microtask
               dispatch({ type: "SET_SCHEDULES", payload: [] });
             }
          });
        }
        return;
      }

      hasAttemptedLoadRef.current = true;

      try {
        loadingIdRef.current = loadingId;
        dispatch({ type: "FETCH_START" });
        addLoadingOperation({ id: loadingId, priority: 5, description: "Carregando agendamentos..."});

        console.log("[ScheduleProvider] Loading schedules for household:", householdId);
        const headers: HeadersInit = {};
        if (userId) {
          headers['X-User-ID'] = userId;
        } else {
           console.warn("[ScheduleProvider] User ID not available when fetching schedules.");
        }

        const response = await fetch(`/api/schedules?householdId=${householdId}`, {
          signal: abortController.signal,
          headers: headers
        });

        if (!isMounted) return;

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[ScheduleProvider] Schedules response error:", { status: response.status, text: errorText });
          throw new Error(`Erro ${response.status}: ${errorText || 'Failed to load schedules'}`);
        }

        const rawSchedulesData: any[] = await response.json();

        if (!isMounted) return;
        console.log(`[ScheduleProvider] Raw schedules fetched: ${rawSchedulesData.length}`);

        // --- Mapping Logic (adjust based on actual API response) ---
        const mappedSchedules: Schedule[] = rawSchedulesData.map(s => ({
          id: String(s.id), 
          catId: String(s.cat_id),
          householdId: s.household_id,
          userId: s.user_id,
          type: s.type, // 'interval' or 'fixedTime'
          interval: s.interval, // number (hours) or null
          // Ensure 'times' is treated as an array, even if null/undefined from DB
          times: Array.isArray(s.times) ? s.times : [], // Expecting string[] or handle DB format
          days: Array.isArray(s.days) ? s.days : [], // <-- Ensure days is always present (required by Schedule type)
          enabled: s.enabled, // boolean
          createdAt: s.created_at ? new Date(s.created_at) : new Date(),
          updatedAt: s.updated_at ? new Date(s.updated_at) : undefined,
          // Map the nested cat object from the API response
          cat: s.cat ? { 
              id: String(s.cat.id),
              name: s.cat.name,
              // Initialize other required CatType fields as undefined/null if not provided by API
              birthdate: undefined,
              weight: null,
              householdId: s.household_id, // Can reuse householdId from schedule
              photo_url: null, // Not included in API response
              restrictions: null, 
              notes: null, 
              feeding_interval: null, // Not included in API response
              portion_size: undefined, 
              createdAt: undefined, // Not relevant for this nested object usually
              updatedAt: undefined, 
             } : undefined, 
        }));
        // --- End Mapping Logic ---
        
        console.log("[ScheduleProvider] Schedules mapped successfully:", mappedSchedules);
        dispatch({ type: "SET_SCHEDULES", payload: mappedSchedules });

      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('[ScheduleProvider] Request aborted');
          return;
        }
        if (!isMounted) return;

        console.error("[ScheduleProvider] Error loading schedules:", error);
        const errorMessage = error.message || "Failed to load schedules";
        dispatch({ type: "FETCH_ERROR", payload: errorMessage });
        toast.error(errorMessage);
      } finally {
        if (isMounted) {
          cleanupLoading();
        }
      }
    };
    
    loadSchedules();

    // Cleanup function
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      cleanupLoading();
    };
    // Depend on householdId and userId to refetch when they change
  }, [currentUser?.householdId, currentUser?.id]); 

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
} 