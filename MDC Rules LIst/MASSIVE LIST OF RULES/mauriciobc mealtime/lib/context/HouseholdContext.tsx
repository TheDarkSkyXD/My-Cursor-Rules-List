"use client";

import React, { createContext, useContext, useReducer, ReactNode, useMemo, useEffect, useRef, useCallback } from 'react';
import { useUserContext } from './UserContext'; // Assuming UserContext provides currentUser
import { useLoading } from './LoadingContext';
import { toast } from 'sonner';
import { Household } from "@/lib/types"; // Assuming Household type definition exists

interface Member {
  id: string;
  name: string;
  role: 'admin' | 'member';
}

interface HouseholdState {
  currentHousehold: Household | null;
  households: Household[];
  members: Member[];
  isLoading: boolean;
  error: string | null;
}

const initialState: HouseholdState = {
  currentHousehold: null,
  households: [],
  members: [],
  isLoading: false,
  error: null,
};

interface HouseholdAction {
  type: 'FETCH_START' | 'FETCH_SUCCESS' | 'FETCH_ERROR' | 'SET_HOUSEHOLD' | 'SET_HOUSEHOLDS' | 'ADD_MEMBER' | 'REMOVE_MEMBER' | 'UPDATE_MEMBER' | 'SYNC_STATE';
  payload?: Household | Household[] | Member | Member[] | string | HouseholdState | { household: Household, members: Member[] };
}

function householdReducer(state: HouseholdState, action: HouseholdAction): HouseholdState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null, households: [] };
    case 'FETCH_SUCCESS':
      const { household, members } = action.payload as { household: Household, members: Member[] };
      return { ...state, isLoading: false, currentHousehold: household, members: members || [], error: null };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload as string };
    case 'SET_HOUSEHOLD':
      return { ...state, currentHousehold: action.payload as Household };
    case 'SET_HOUSEHOLDS':
      return { ...state, isLoading: false, households: action.payload as Household[], error: null };
    case 'ADD_MEMBER':
      return { ...state, members: [...state.members, action.payload as Member] };
    case 'REMOVE_MEMBER':
      return { ...state, members: state.members.filter(member => member.id !== (action.payload as Member).id) };
    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map(member =>
          member.id === (action.payload as Member).id ? { ...member, ...(action.payload as Member) } : member
        ),
      };
    default:
      return state;
  }
}

const HouseholdContext = createContext<{
  state: HouseholdState;
  dispatch: React.Dispatch<HouseholdAction>;
}>({ state: initialState, dispatch: () => null });

export const HouseholdProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(householdReducer, initialState);
  const { state: userState } = useUserContext();
  const { currentUser } = userState;
  const { addLoadingOperation, removeLoadingOperation } = useLoading();
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  const cleanupLoading = useCallback(() => {
    if (loadingIdRef.current) {
      try {
        removeLoadingOperation(loadingIdRef.current);
      } catch (error) {
        console.error('[HouseholdProvider] Error cleaning up loading:', error);
      } finally {
        loadingIdRef.current = null;
      }
    }
  }, [removeLoadingOperation]);

  useEffect(() => {
    const loadingId = 'household-data-load';
    let isMounted = true;

    const loadHouseholdData = async () => {
      if (!currentUser?.id || !isMounted || isFetchingRef.current) return;

      isFetchingRef.current = true;
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        loadingIdRef.current = loadingId;
        dispatch({ type: 'FETCH_START' });
        addLoadingOperation({ id: loadingId, priority: 2, description: 'Carregando residências...' });

        const response = await fetch(`/api/households`, {
          signal: abortController.signal,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!isMounted) {
          abortController.abort();
          isFetchingRef.current = false;
          return;
        }

        if (!response.ok) {
          let errorMsg = `Erro ao carregar residências (${response.status})`;
          try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const errorData = await response.json();
              errorMsg = errorData.error || errorMsg;
            } else {
              // Attempt to read as text if not JSON
              const errorText = await response.text();
              // Prevent logging the entire HTML page if it's long
              errorMsg = errorText.length > 200 ? errorText.substring(0, 200) + "..." : errorText || errorMsg;
              console.error("[HouseholdProvider] Non-JSON error response:", errorText);
            }
          } catch (e) {
            console.error("[HouseholdProvider] Failed to parse error response:", e);
            // Keep the original status code message if parsing fails
          }
          throw new Error(errorMsg);
        }

        const householdsData: Household[] = await response.json();

        if (!isMounted) {
          isFetchingRef.current = false;
          return;
        }

        dispatch({ type: 'SET_HOUSEHOLDS', payload: householdsData });

      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('[HouseholdProvider] Request aborted');
          return;
        }

        if (!isMounted) {
          isFetchingRef.current = false;
          return;
        }

        console.error("[HouseholdProvider] Error loading data:", error);
        const errorMessage = error.message || 'Falha ao carregar dados das residências';
        dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
        toast.error(errorMessage);
      } finally {
        if (isMounted) {
          cleanupLoading();
        }
        isFetchingRef.current = false;
      }
    };

    loadHouseholdData();

    return () => {
      isMounted = false;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      isFetchingRef.current = false;
    };
  }, [currentUser?.id, addLoadingOperation, cleanupLoading]);

  const contextValue = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <HouseholdContext.Provider value={contextValue}>
      {children}
    </HouseholdContext.Provider>
  );
};

export const useHousehold = () => useContext(HouseholdContext);

export const useHouseholdSelector = <T, >(selector: (state: HouseholdState) => T): T => {
  const { state } = useHousehold();
  return selector(state);
};