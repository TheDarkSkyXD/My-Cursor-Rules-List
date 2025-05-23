"use client";

import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useMemo } from "react";
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationsCount
} from "@/lib/services/notificationService";
import { Notification } from "@/lib/types/notification";
import { useUserContext } from "./UserContext";
import { useLoading } from "@/lib/context/LoadingContext";
import { storageService } from "@/lib/utils/storage";
import { usePathname } from 'next/navigation';
import { createClient } from "@/utils/supabase/client";

// Storage keys
const STORAGE_KEYS = {
  NOTIFICATIONS: 'notifications',
  UNREAD_COUNT: 'notifications_unread_count',
  PAGE: 'notifications_page',
  TOTAL_PAGES: 'notifications_total_pages',
  HAS_MORE: 'notifications_has_more'
} as const;

// Types
interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  hasMore: boolean;
  message?: string;
}

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  hasMore: boolean;
};

type NotificationAction =
  | { type: "SET_NOTIFICATIONS"; payload: { notifications: Notification[]; totalPages: number; hasMore: boolean; unreadCount?: number } }
  | { type: "APPEND_NOTIFICATIONS"; payload: { notifications: Notification[]; totalPages: number; hasMore: boolean } }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_NOTIFICATION_READ"; payload: { id: string } }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "REMOVE_NOTIFICATION"; payload: { id: string } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_UNREAD_COUNT"; payload: number };

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  hasMore: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
}

// Initial state with storage integration
const getInitialState = (): NotificationState => {
  try {
    return {
      notifications: storageService.get<Notification[]>(STORAGE_KEYS.NOTIFICATIONS) ?? [],
      unreadCount: storageService.get<number>(STORAGE_KEYS.UNREAD_COUNT) ?? 0,
      isLoading: false,
      error: null,
      page: storageService.get<number>(STORAGE_KEYS.PAGE) ?? 1,
      totalPages: storageService.get<number>(STORAGE_KEYS.TOTAL_PAGES) ?? 1,
      hasMore: storageService.get<boolean>(STORAGE_KEYS.HAS_MORE) ?? false
    };
  } catch (error) {
    console.error('[NotificationContext] Error loading initial state from storage:', error);
    return {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      page: 1,
      totalPages: 1,
      hasMore: false
    };
  }
};

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Utility to normalize notification object keys to camelCase
function normalizeNotification(raw: any): Notification {
  return {
    id: String(raw.id),
    title: raw.title,
    message: raw.message,
    type: raw.type,
    isRead: raw.is_read ?? raw.isRead ?? false,
    createdAt: raw.created_at || raw.createdAt || '',
    updatedAt: raw.updated_at || raw.updatedAt || '',
    userId: raw.user_id || raw.userId || '',
    metadata: raw.metadata ?? undefined,
  };
}

// Reducer function with storage updates
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  console.log(`[NotificationReducer] Action: ${action.type}`, { payload: 'payload' in action ? action.payload : undefined });
  try {
    let newState: NotificationState;
    switch (action.type) {
      case "SET_NOTIFICATIONS":
        const unreadCount = action.payload.unreadCount !== undefined ? action.payload.unreadCount : state.unreadCount;
        newState = { 
          ...state, 
          notifications: action.payload.notifications ?? [],
          totalPages: action.payload.totalPages ?? 1,
          hasMore: action.payload.hasMore ?? false,
          unreadCount: Math.max(0, unreadCount),
          page: 1
        };
        // Update storage
        storageService.set(STORAGE_KEYS.NOTIFICATIONS, newState.notifications);
        storageService.set(STORAGE_KEYS.UNREAD_COUNT, newState.unreadCount);
        storageService.set(STORAGE_KEYS.PAGE, newState.page);
        storageService.set(STORAGE_KEYS.TOTAL_PAGES, newState.totalPages);
        storageService.set(STORAGE_KEYS.HAS_MORE, newState.hasMore);
        break;
      case "APPEND_NOTIFICATIONS":
        const existingIds = new Set(state.notifications.map(n => n.id));
        const newNotifications = action.payload.notifications.filter(n => !existingIds.has(n.id));
        newState = {
          ...state,
          notifications: [...state.notifications, ...newNotifications],
          totalPages: action.payload.totalPages ?? state.totalPages,
          hasMore: action.payload.hasMore ?? false,
        };
        // Update storage
        storageService.set(STORAGE_KEYS.NOTIFICATIONS, newState.notifications);
        storageService.set(STORAGE_KEYS.TOTAL_PAGES, newState.totalPages);
        storageService.set(STORAGE_KEYS.HAS_MORE, newState.hasMore);
        break;
      case "ADD_NOTIFICATION":
        if (state.notifications.some(n => n.id === action.payload.id)) {
            console.log(`[NotificationReducer] Notification ${action.payload.id} already exists. Skipping.`);
            newState = state;
            break;
        }
        newState = { 
          ...state, 
          notifications: [normalizeNotification(action.payload), ...state.notifications],
          unreadCount: state.unreadCount + (normalizeNotification(action.payload).isRead ? 0 : 1)
        };
        // Update storage
        storageService.set(STORAGE_KEYS.NOTIFICATIONS, newState.notifications);
        storageService.set(STORAGE_KEYS.UNREAD_COUNT, newState.unreadCount);
        break;
      case "MARK_NOTIFICATION_READ":
        let changedRead = false;
        const markedNotifications = state.notifications.map(notification => {
            if (notification.id === action.payload.id && !notification.isRead) {
                console.log(`[NotificationReducer] Marking notification ${action.payload.id} as read.`);
                changedRead = true;
                return { ...notification, isRead: true };
            }
            return notification;
        });
        newState = { 
          ...state, 
          notifications: markedNotifications,
          unreadCount: Math.max(0, state.unreadCount - (changedRead ? 1 : 0))
        };
        // Update storage
        storageService.set(STORAGE_KEYS.NOTIFICATIONS, newState.notifications);
        storageService.set(STORAGE_KEYS.UNREAD_COUNT, newState.unreadCount);
        break;
      case "MARK_ALL_NOTIFICATIONS_READ":
        const anyUnread = state.notifications.some(n => !n.isRead);
        if (!anyUnread) {
            console.log(`[NotificationReducer] No unread notifications to mark as read.`);
            newState = state;
            break;
        }
        
        const allReadNotifications = state.notifications.map(notification => (
            notification.isRead ? notification : { ...notification, isRead: true }
        ));
        newState = { 
          ...state, 
          notifications: allReadNotifications,
          unreadCount: 0
        };
        // Update storage
        storageService.set(STORAGE_KEYS.NOTIFICATIONS, newState.notifications);
        storageService.set(STORAGE_KEYS.UNREAD_COUNT, newState.unreadCount);
        break;
      case "REMOVE_NOTIFICATION":
        const notificationToRemove = state.notifications.find(
          notification => notification.id === action.payload.id
        );
        if (!notificationToRemove) {
          console.log(`[NotificationReducer] Notification ${action.payload.id} not found for removal.`);
          newState = state;
          break;
        }
        const filteredNotifications = state.notifications.filter(
          notification => notification.id !== action.payload.id
        );
        const newUnreadCount = !notificationToRemove?.isRead 
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount;
        newState = { 
          ...state, 
          notifications: filteredNotifications,
          unreadCount: newUnreadCount
        };
        // Update storage
        storageService.set(STORAGE_KEYS.NOTIFICATIONS, newState.notifications);
        storageService.set(STORAGE_KEYS.UNREAD_COUNT, newState.unreadCount);
        break;
      case "SET_LOADING":
        newState = { ...state, isLoading: action.payload };
        break;
      case "SET_ERROR":
        newState = { ...state, error: action.payload };
        break;
      case "SET_PAGE":
        newState = { ...state, page: Math.max(1, action.payload) };
        // Update storage
        storageService.set(STORAGE_KEYS.PAGE, newState.page);
        break;
      case "SET_UNREAD_COUNT":
         newState = { ...state, unreadCount: Math.max(0, action.payload) };
         // Update storage
         storageService.set(STORAGE_KEYS.UNREAD_COUNT, newState.unreadCount);
         break;
      default:
        console.log(`[NotificationReducer] Unknown action type.`);
        newState = state;
    }
    console.log(`[NotificationReducer] State updated:`, newState);
    return newState;
  } catch (error) {
    console.error("[NotificationReducer] Error processing action:", { action, error });
    return { ...state, error: "An unexpected error occurred in the reducer." };
  }
}

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  console.log('[METRIC] NotificationProvider initialized');
  const [state, dispatch] = useReducer(notificationReducer, getInitialState());
  const { state: userState, authLoading } = useUserContext();
  const userLoading = userState.isLoading;
  const { addLoadingOperation, removeLoadingOperation } = useLoading();
  const currentUser = userState.currentUser;
  const currentUserId = currentUser?.id;
  const pathname = usePathname();
  const isOnHomePage = pathname === '/';
  
  console.log("[NotificationProvider] Initializing with state:", state, "User:", currentUser, "Path:", pathname);

  // Clear storage when user logs out
  useEffect(() => {
    if (!currentUserId && !userLoading && !authLoading) {
      Object.values(STORAGE_KEYS).forEach(key => storageService.remove(key));
    }
  }, [currentUserId, userLoading, authLoading]);

  const fetchInitialData = useCallback(async (userId: string) => {
    console.log(`[NotificationProvider] fetchInitialData called for userId: ${userId}`);
    if (!userId) {
      console.log("[NotificationProvider] No userId, skipping initial fetch.");
      return;
    }
    const loadingOpId = `notifications-initial-${userId}`;
    addLoadingOperation({ id: loadingOpId, priority: 1, description: "Loading notifications..." });
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    dispatch({ type: "SET_PAGE", payload: 1 });

    try {
      console.log(`[NotificationProvider] Fetching notifications and unread count for userId: ${userId}`);
      
      const [notificationsResponse, unreadCountResponse] = await Promise.all([
        getUserNotifications(1, 10),
        getUnreadNotificationsCount()
      ]);
      console.log(`[NotificationProvider] Received initial data:`, { notificationsResponse, unreadCountResponse });

      if (!notificationsResponse || !Array.isArray(notificationsResponse.data)) {
        console.error("[NotificationContext] Invalid notifications response structure:", notificationsResponse);
        dispatch({ type: "SET_ERROR", payload: "Failed to process notification data (invalid structure)." });
        return;
      }
      
      const formattedNotifications = notificationsResponse.data.map(normalizeNotification);

      if (typeof unreadCountResponse !== 'number') {
        console.error("[NotificationContext] Invalid unread count response type:", unreadCountResponse);
        dispatch({ type: "SET_ERROR", payload: "Failed to process unread count (invalid type)." });
        return;
      }
      
      console.log("[NotificationProvider] Dispatching SET_NOTIFICATIONS");
      dispatch({
        type: "SET_NOTIFICATIONS",
        payload: {
          notifications: formattedNotifications, 
          totalPages: notificationsResponse.totalPages,
          hasMore: notificationsResponse.hasMore,
          unreadCount: unreadCountResponse
        }
      });
    } catch (error) {
      console.error("[NotificationProvider] Error in fetchInitialData:", error);
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to load notifications" });
    } finally {
      console.log(`[NotificationProvider] fetchInitialData finished for userId: ${userId}`);
      dispatch({ type: "SET_LOADING", payload: false });
      removeLoadingOperation(loadingOpId);
    }
  }, [addLoadingOperation, removeLoadingOperation]);

  // Effect to trigger initial data fetch when userId becomes available or user logs out
  useEffect(() => {
    if (!isOnHomePage) return; // Only fetch on '/'
    if (currentUserId) {
      if ((Array.isArray(state.notifications) ? state.notifications.length : 0) === 0 && !state.isLoading && state.error === null) {
          console.log("[NotificationProvider] State allows initial fetch, calling fetchInitialData.");
          fetchInitialData(currentUserId);
      } else {
          console.log("[NotificationProvider] State prevents initial fetch (already loaded/loading/error):", {isLoading: state.isLoading, hasNotifications: (Array.isArray(state.notifications) ? state.notifications.length : 0) > 0, error: state.error });
      }
    } else if (!currentUserId && !userLoading && !authLoading) {
        console.log("[NotificationProvider] User logged out (or loading finished with no user), clearing notifications.");
        if ((Array.isArray(state.notifications) ? state.notifications.length : 0) > 0 || state.unreadCount > 0) {
            dispatch({ type: 'SET_NOTIFICATIONS', payload: { notifications: [], totalPages: 1, hasMore: false, unreadCount: 0 } });
            dispatch({ type: 'SET_PAGE', payload: 1 });
        }
    }
    // Only include minimal, stable dependencies to prevent infinite loops.
  }, [
    isOnHomePage,
    currentUserId,
    userLoading,
    authLoading
  ]);

  const refreshNotifications = useCallback(async () => {
    if (!currentUserId) {
        console.warn("[NotificationProvider] refreshNotifications called without userId.");
        return;
    }
    console.log(`[NotificationProvider] Refreshing notifications for userId: ${currentUserId}...`);
    await fetchInitialData(currentUserId);
  }, [fetchInitialData, currentUserId]);

  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isLoading || !currentUserId) {
      console.log("[NotificationProvider] Cannot load more:", { hasMore: state.hasMore, isLoading: state.isLoading, currentUserId });
      return;
    }
    const nextPage = state.page + 1;
    console.log(`[NotificationProvider] Loading more notifications, page: ${nextPage}`);
    const loadingOpId = `notifications-load-more-${currentUserId}-${nextPage}`;
    addLoadingOperation({ id: loadingOpId, priority: 2, description: "Loading more notifications..." });
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_PAGE", payload: nextPage });

    try {
      const response = await getUserNotifications(nextPage, 10);
      console.log(`[NotificationProvider] Received more notifications:`, response);

      if (!response || !Array.isArray(response.data)) {
          console.error("[NotificationContext] Invalid load more response structure:", response);
          dispatch({ type: "SET_ERROR", payload: "Failed to process more notification data (invalid structure)." });
          dispatch({ type: "SET_PAGE", payload: state.page });
          return;
      }
      
      const formattedNotifications = response.data.map(normalizeNotification);

      dispatch({ 
        type: "APPEND_NOTIFICATIONS", 
        payload: { 
          notifications: formattedNotifications,
          totalPages: response.totalPages,
          hasMore: response.hasMore
        }
      });
    } catch (error) {
      console.error("[NotificationProvider] Error loading more notifications:", error);
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Failed to load more notifications" });
      dispatch({ type: "SET_PAGE", payload: state.page });
    } finally {
      console.log(`[NotificationProvider] Load more finished, page: ${nextPage}`);
      dispatch({ type: "SET_LOADING", payload: false });
      removeLoadingOperation(loadingOpId);
    }
  }, [state.hasMore, state.isLoading, state.page, addLoadingOperation, removeLoadingOperation, currentUserId]);

  const markAsRead = useCallback(async (id: string) => {
    console.log(`[NotificationProvider] Marking notification ${id} as read`);
    const loadingOpId = `notifications-mark-read-${id}`;
    addLoadingOperation({ id: loadingOpId, priority: 3, description: "Marking notification as read..." });
    try {
      await markNotificationAsRead(id);
      console.log(`[NotificationProvider] Successfully marked ${id} as read via service.`);
      dispatch({ type: "MARK_NOTIFICATION_READ", payload: { id } });
    } catch (error) {
      console.error(`[NotificationProvider] Error marking notification ${id} as read:`, error);
    } finally {
        removeLoadingOperation(loadingOpId);
    }
  }, [addLoadingOperation, removeLoadingOperation]);

  const markAllAsRead = useCallback(async () => {
    console.log(`[NotificationProvider] Marking all notifications as read`);
    const loadingOpId = `notifications-mark-all-read`;
    addLoadingOperation({ id: loadingOpId, priority: 3, description: "Marking all notifications as read..." });
    try {
      await markAllNotificationsAsRead();
      console.log(`[NotificationProvider] Successfully marked all as read via service.`);
      dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" });
    } catch (error) {
      console.error("[NotificationProvider] Error marking all notifications as read:", error);
    } finally {
        removeLoadingOperation(loadingOpId);
    }
  }, [addLoadingOperation, removeLoadingOperation]);

  const removeNotification = useCallback(async (id: string) => {
    console.log(`[NotificationProvider] Removing notification ${id}`);
    const loadingOpId = `notifications-remove-${id}`;
    addLoadingOperation({ id: loadingOpId, priority: 3, description: "Removing notification..." });
    try {
      await deleteNotification(id);
      console.log(`[NotificationProvider] Successfully removed ${id} via service.`);
      dispatch({ type: "REMOVE_NOTIFICATION", payload: { id } });
    } catch (error) {
      console.error(`[NotificationProvider] Error removing notification ${id}:`, error);
    } finally {
        removeLoadingOperation(loadingOpId);
    }
  }, [addLoadingOperation, removeLoadingOperation]);

  // Supabase Realtime subscription for notifications
  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUserId}` },
        (payload) => {
          if (payload?.new) {
            dispatch({ type: "ADD_NOTIFICATION", payload: normalizeNotification(payload.new) });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const value = useMemo(() => ({
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    error: state.error,
    page: state.page,
    totalPages: state.totalPages,
    hasMore: state.hasMore,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refreshNotifications,
    loadMore,
  }), [
    state.notifications,
    state.unreadCount,
    state.isLoading,
    state.error,
    state.page,
    state.totalPages,
    state.hasMore,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refreshNotifications,
    loadMore
  ]);
  
  console.log("[NotificationProvider] Rendering with value:", value);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use the context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    console.error("useNotifications hook used outside of NotificationProvider");
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  console.log("[useNotifications] Consuming context:", context);
  return context;
}

