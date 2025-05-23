"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useMemo, useRef, useCallback, useState } from "react";
import { createClient } from '@/utils/supabase/client'; // Import Supabase client
import { User as SupabaseUser } from '@supabase/supabase-js'; // Import Supabase types
import { useLoading } from "./LoadingContext";
import { toast } from "sonner";
import { User as CurrentUserType, NotificationSettings } from "@/lib/types";
import { getUserProfile, getFirstHouseholdMembership } from '@/lib/actions/userActions'; // Import the Server Actions
import { logger } from '@/lib/monitoring/logger'; // Import logger

interface UserState {
  currentUser: CurrentUserType | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  isLoading: true,
  error: null,
};

interface UserAction {
  type: "FETCH_START" | "SET_CURRENT_USER" | "FETCH_ERROR" | "CLEAR_USER";
  payload?: CurrentUserType | string | null;
}

function userReducer(state: UserState, action: UserAction): UserState {
  console.log(`[userReducer] Dispatching: ${action.type}`, action.payload);
  switch (action.type) {
    case "FETCH_START":
      console.log("[userReducer] FETCH_START -> isLoading: true");
      return { ...state, isLoading: true, error: null };
    case "SET_CURRENT_USER":
      console.log("[userReducer] SET_CURRENT_USER -> isLoading: false, currentUser:", action.payload);
      return { ...state, isLoading: false, currentUser: action.payload as CurrentUserType | null, error: null };
    case "FETCH_ERROR":
      console.error("[userReducer] FETCH_ERROR -> isLoading: false, error:", action.payload);
      return { ...state, isLoading: false, error: action.payload as string };
    case "CLEAR_USER":
      console.warn("[userReducer] CLEAR_USER -> isLoading: false, currentUser: null");
      return { ...initialState, isLoading: false };
    default:
      console.warn("[userReducer] Unknown action type:", action.type);
      return state;
  }
}

interface UserContextValue {
  state: UserState;
  profile: CurrentUserType | null;
  authLoading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

// Add debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Add a type guard for error with message
function isErrorWithMessage(err: unknown): err is { message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as any).message === 'string'
  );
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, initialState);
  const [supabase] = useState(() => {
    logger.info("[UserProvider] Initializing Supabase client");
    try {
      const client = createClient();
      logger.info("[UserProvider] Supabase client initialized successfully");
      return client;
    } catch (error) {
      logger.error("[UserProvider] Error initializing Supabase client:", error);
      throw error;
    }
  });
  const [profile, setProfile] = useState<CurrentUserType | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const mountedRef = useRef(true);
  const lastProfileFetchRef = useRef<string | null>(null);
  const authCheckCountRef = useRef(0);

  // Set mounted ref
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadUserData = useCallback(async (currentUserFromSupabase: SupabaseUser | null) => {
    if (!currentUserFromSupabase || !mountedRef.current) {
      if (state.currentUser) {
        dispatch({ type: "CLEAR_USER" });
      }
      setProfile(null);
      lastProfileFetchRef.current = null;
      setAuthLoading(false);
      return;
    }

    if (lastProfileFetchRef.current === currentUserFromSupabase.id) {
      setAuthLoading(false);
      return;
    }

    dispatch({ type: "FETCH_START" });
    lastProfileFetchRef.current = currentUserFromSupabase.id;

    try {
      // Fetch profile first (we know it lacks householdId)
      const { data: fetchedProfile, error: fetchError } = await getUserProfile();

      if (!mountedRef.current) {
        setAuthLoading(false);
        return;
      }

      if (fetchError != null) {
        logger.error("[UserProvider] Error fetching user profile:", { error: fetchError });
        // Check if it's a database connection error
        if (
          isErrorWithMessage(fetchError) &&
          fetchError.message.includes("FATAL: Tenant or user not found")
        ) {
          toast.error("Erro de conexão com o banco de dados. Por favor, tente novamente mais tarde.");
          logger.error("[UserProvider] Database connection error:", { error: fetchError });
        }
        dispatch({ type: "FETCH_ERROR", payload: typeof fetchError === 'string' ? fetchError : (isErrorWithMessage(fetchError as unknown) ? (fetchError as { message: string }).message : 'Unknown error') });
        setProfile(null);
        lastProfileFetchRef.current = null;
        setAuthLoading(false);
        return;
      }

      let primaryHouseholdId: string | null = null;
      if (fetchedProfile) {
        setProfile(fetchedProfile);
        logger.info("[UserProvider] Profile fetched, now fetching first household membership...");
        
        // Fetch the first household membership
        const { data: membershipData, error: membershipError } = await getFirstHouseholdMembership(currentUserFromSupabase.id);

        if (!mountedRef.current) {
          setAuthLoading(false);
          return; // Abort if component unmounted during async calls
        }

        if (membershipError) {
          // Log error but don't block user loading, householdId will be null
          logger.error("[UserProvider] Error fetching household membership:", { error: membershipError });
          toast.error("Erro ao verificar a qual residência pertence.");
        } else if (membershipData) {
          primaryHouseholdId = membershipData.household_id;
          logger.info(`[UserProvider] Found primary household ID: ${primaryHouseholdId}`);
        } else {
          logger.info("[UserProvider] User is not a member of any household.");
        }

        // Construct user data including the fetched household ID
        const userData: CurrentUserType = {
          id: currentUserFromSupabase.id,
          name: fetchedProfile.name ?? currentUserFromSupabase.email ?? "Usuário",
          email: currentUserFromSupabase.email!,
          avatar: fetchedProfile.avatar,
          households: fetchedProfile.households ?? [],
          primaryHousehold: primaryHouseholdId ?? "",
          householdId: primaryHouseholdId,
          preferences: {
            timezone: fetchedProfile.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: fetchedProfile.preferences?.language || "pt-BR",
            notifications: fetchedProfile.preferences?.notifications || {
              pushEnabled: false,
              emailEnabled: false,
              feedingReminders: false,
              missedFeedingAlerts: false,
              householdUpdates: false
            }
          },
          role: fetchedProfile.role,
          imageUrl: fetchedProfile.imageUrl
        };

        dispatch({ type: "SET_CURRENT_USER", payload: userData });
      } else {
        // No profile found but no error - this is a valid state for new users
        // They won't have a household membership yet either
        logger.info("[UserProvider] No profile found for user, treating as new user.");
        // Fill all required fields for CurrentUserType, use defaults if needed
        dispatch({ type: "SET_CURRENT_USER", payload: {
          id: currentUserFromSupabase.id,
          email: currentUserFromSupabase.email!,
          name: currentUserFromSupabase.email ?? "Usuário",
          avatar: undefined,
          households: [],
          primaryHousehold: "",
          householdId: null,
          preferences: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: "pt-BR",
            notifications: {
              pushEnabled: false,
              emailEnabled: false,
              feedingReminders: false,
              missedFeedingAlerts: false,
              householdUpdates: false
            }
          },
          role: "user"
        } as CurrentUserType });
      }
    } catch (error) {
      logger.error("[UserProvider] Error fetching user data:", { error });
      dispatch({ type: "FETCH_ERROR", payload: "Failed to load user data" });
      setProfile(null);
      lastProfileFetchRef.current = null;
      // Show a user-friendly error message
      if (error instanceof Error) {
        if (error.message?.includes("FATAL: Tenant or user not found")) {
          toast.error("Erro de conexão com o banco de dados. Por favor, tente novamente mais tarde.");
        } else {
          toast.error("Erro ao carregar dados do usuário. Por favor, tente novamente.");
        }
      }
    } finally {
      if (mountedRef.current) {
        setAuthLoading(false);
      }
    }
  }, []);

  const handleAuthChange = useCallback(async () => {
    const requestId = ++authCheckCountRef.current;
    logger.info(`[UserProvider][Request ${requestId}] handleAuthChange triggered`);

    if (!mountedRef.current) {
      logger.warn(`[UserProvider][Request ${requestId}] handleAuthChange aborted: component not mounted`);
      return;
    }

    try {
      logger.info(`[UserProvider][Request ${requestId}] Calling supabase.auth.getUser()`);
      const authResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        )
      ]);

      // Type assertion since we know this is the success case
      const { data: { user: verifiedUser }, error: userError } = authResult as Awaited<ReturnType<typeof supabase.auth.getUser>>;
      
      logger.info(`[UserProvider][Request ${requestId}] supabase.auth.getUser() result: user=${verifiedUser ? verifiedUser.id : 'null'}, error=${userError ? JSON.stringify(userError) : 'null'}`);
      
      if (userError) {
        logger.error(`[UserProvider][Request ${requestId}] Auth error:`, { error: userError });
        throw userError;
      }

      if (!verifiedUser) {
        logger.warn(`[UserProvider][Request ${requestId}] No verified user found. Clearing user state.`);
        setProfile(null);
        dispatch({ type: "CLEAR_USER" });
        lastProfileFetchRef.current = null;
        setAuthLoading(false);
        return;
      }

      logger.info(`[UserProvider][Request ${requestId}] Verified user found: ${verifiedUser.id}. Calling loadUserData.`);
      await loadUserData(verifiedUser);
    } catch (error) {
      logger.error(`[UserProvider][Request ${requestId}] Error in auth change handler:`, error);
      setProfile(null);
      dispatch({ type: "CLEAR_USER" });
      lastProfileFetchRef.current = null;
      setAuthLoading(false);
    }
  }, [supabase.auth, loadUserData]);

  // Debounced version of handleAuthChange
  const debouncedHandleAuthChange = useMemo(
    () => debounce(handleAuthChange, 300),
    [handleAuthChange]
  );

  // Set up auth state change listener
  useEffect(() => {
    logger.info("[UserProvider] Setting up auth state change listener");
    setAuthLoading(true);
    
    // Initial auth check
    handleAuthChange();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      logger.info("[UserProvider] Auth state change detected");
      debouncedHandleAuthChange();
    });

    return () => {
      logger.info("[UserProvider] Cleaning up auth state change listener");
      subscription.unsubscribe();
    };
  }, [supabase.auth, handleAuthChange, debouncedHandleAuthChange]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      dispatch({ type: "CLEAR_USER" });
      setProfile(null);
      lastProfileFetchRef.current = null;
      
      logger.info("[UserProvider] User signed out successfully");
    } catch (error) {
      logger.error("[UserProvider] Error signing out:", error);
      throw error;
    }
  }, [supabase.auth]);

  const refreshUser = useCallback(async () => {
    lastProfileFetchRef.current = null;
    await handleAuthChange();
  }, [handleAuthChange]);

  const value = useMemo(() => ({
    state,
    profile,
    authLoading,
    signOut,
    refreshUser
  }), [state, profile, authLoading, signOut, refreshUser]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}