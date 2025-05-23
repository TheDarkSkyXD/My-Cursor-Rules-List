import { Notification, CreateNotificationPayload } from "../types/notification";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// Get all notifications for a user with pagination
export async function getUserNotifications(
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<Notification>> {
  console.log(`[NotificationService] getUserNotifications called: page=${page}, limit=${limit}`);
  try {
    const url = `/api/notifications?page=${page}&limit=${limit}`;
    console.log(`[NotificationService] Fetching URL: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include'
    });
    console.log(`[NotificationService] getUserNotifications response status: ${response.status}`);

    if (!response.ok) {
      let errorMsg = `Failed to fetch notifications (Status: ${response.status})`;
      let errorBody = '';
      try {
        errorBody = await response.text();
        console.error(`[NotificationService] getUserNotifications failed: Status ${response.status}, Body: ${errorBody}`);
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = JSON.parse(errorBody);
          errorMsg = errorData.error || errorMsg;
        }
      } catch (e) {
        console.error(`[NotificationService] Failed to read or parse error body:`, e);
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return {
      data: data.notifications.map((n: any) => ({
        ...n,
        id: String(n.id),
        created_at: new Date(n.created_at),
        updated_at: new Date(n.updated_at)
      })),
      total: data.total,
      page: data.page,
      totalPages: data.totalPages,
      hasMore: data.hasMore,
    };
  } catch (error) {
    console.error('[NotificationService] getUserNotifications error:', error);
    throw error;
  }
}

// Get unread notifications count
export async function getUnreadNotificationsCount(): Promise<number> {
  console.log('[NotificationService] getUnreadNotificationsCount called');
  try {
    const response = await fetch('/api/notifications/unread-count', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMsg = `Failed to get unread count (Status: ${response.status})`;
      let errorBody = '';
      try {
        errorBody = await response.text();
        console.error(`[NotificationService] getUnreadNotificationsCount failed: Status ${response.status}, Body: ${errorBody}`);
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = JSON.parse(errorBody);
          errorMsg = errorData.error || errorMsg;
        }
      } catch (e) {
        console.error(`[NotificationService] Failed to read or parse error body:`, e);
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error('[NotificationService] getUnreadNotificationsCount error:', error);
    throw error;
  }
}

// Create a new notification
// Payload no longer includes userId or householdId; these are derived from the session on the server.
export async function createNotification(payload: Omit<CreateNotificationPayload, 'userId' | 'householdId'>): Promise<Notification> {
  console.log("[NotificationService] createNotification called with simplified payload:", payload);
  try {
    // Basic validation for the essential fields
    const requiredFields: (keyof typeof payload)[] = ['title', 'message', 'type'];
    const missingFields = requiredFields.filter(field => !payload[field]);
    if (missingFields.length > 0) {
      console.error('[NotificationService] createNotification - Missing required fields:', missingFields);
      throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
    }
    console.log('[NotificationService] createNotification - Payload validated, sending request...');

    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Crucial for sending session cookies
      body: JSON.stringify(payload) // Send the simplified payload
    });
    console.log(`[NotificationService] createNotification response status: ${response.status}`);

    if (!response.ok) {
      let errorMsg = `Falha ao criar notificação (Status: ${response.status})`;
      let errorBody = '';
      try {
        errorBody = await response.text();
         console.error('[NotificationService] createNotification - Server error response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorBody
         });
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errorData = JSON.parse(errorBody);
            errorMsg = errorData.error || errorMsg;
        } else {
          errorMsg = `${errorMsg} - ${errorBody}`;
        }
      } catch (e) {
        console.error(`[NotificationService] createNotification - Failed to read or parse error body:`, e);
      }
      throw new Error(errorMsg);
    }

    // Handle success case
    const contentType = response.headers.get("content-type");
     if (!(contentType && contentType.includes("application/json"))) {
      const textResponse = await response.text();
      console.error("[NotificationService] createNotification - Server returned non-JSON success response:", textResponse);
      throw new Error("Resposta inesperada do servidor após criar notificação.");
    }

    let data: any;
    try {
        // Should return the newly created notification object(s)
        data = await response.json(); 
    } catch (parseError) {
        console.error("[NotificationService] createNotification - Failed to parse successful JSON response:", parseError);
        throw new Error("Falha ao processar a resposta do servidor após criar notificação.");
    }

    console.log("[NotificationService] createNotification received response data:", data);

    // The API might return an object indicating count, or the actual created notification(s)
    // Adjust validation based on expected API response for POST
    // Assuming it returns the created notification object directly or within an array
    const createdNotification = Array.isArray(data) ? data[0] : data;
    
    if (!createdNotification || typeof createdNotification.id !== 'string' || typeof createdNotification.title !== 'string') { 
       console.error('[NotificationService] createNotification - Invalid notification structure in response:', data);
       throw new Error('Resposta inválida do servidor após criar notificação');
    }

    console.log('[NotificationService] Successfully created notification:', createdNotification);
    // Return the first created notification if multiple were theoretically possible via API?
    // Or adjust return type if API response is different (e.g., just a success status)
    return { 
        ...createdNotification,
        created_at: new Date(createdNotification.created_at),
        updated_at: new Date(createdNotification.updated_at)
    } as Notification;
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
    throw error; // Re-throw error
  }
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  console.log(`[NotificationService] markNotificationAsRead called for id: ${notificationId}`);
  try {
    const response = await fetch(`/api/notifications`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        notificationIds: [notificationId],
        read: true
      })
    });

    if (!response.ok) {
      let errorMsg = `Failed to mark notification as read (Status: ${response.status})`;
      let errorBody = '';
      try {
        errorBody = await response.text();
        console.error(`[NotificationService] markNotificationAsRead failed: Status ${response.status}, Body: ${errorBody}`);
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = JSON.parse(errorBody);
          errorMsg = errorData.error || errorMsg;
        }
      } catch (e) {
        console.error(`[NotificationService] Failed to read or parse error body:`, e);
      }
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('[NotificationService] markNotificationAsRead error:', error);
    throw error;
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(): Promise<void> {
  console.log('[NotificationService] markAllNotificationsAsRead called');
  try {
    const response = await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMsg = `Failed to mark all notifications as read (Status: ${response.status})`;
      let errorBody = '';
      try {
        errorBody = await response.text();
        console.error(`[NotificationService] markAllNotificationsAsRead failed: Status ${response.status}, Body: ${errorBody}`);
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = JSON.parse(errorBody);
          errorMsg = errorData.error || errorMsg;
        }
      } catch (e) {
        console.error(`[NotificationService] Failed to read or parse error body:`, e);
      }
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('[NotificationService] markAllNotificationsAsRead error:', error);
    throw error;
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<void> {
  console.log(`[NotificationService] deleteNotification called for id: ${notificationId}`);
  try {
    // Call the specific DELETE endpoint for the given ID
    const response = await fetch(`/api/notifications/${notificationId}`, { // Correct endpoint
      method: 'DELETE',
      headers: {
        // No Content-Type needed for empty body
        'Accept': 'application/json', // Still accept JSON errors
      },
      credentials: 'include',
      // No body needed for DELETE by ID endpoint
      // body: JSON.stringify({
      //   notificationIds: [notificationId]
      // })
    });

    // Expect 204 No Content on successful deletion
    if (response.status === 204) {
      console.log(`[NotificationService] deleteNotification successful for id: ${notificationId}`);
      return; // Success
    }
    
    // Handle other non-OK responses
    if (!response.ok) { 
      let errorMsg = `Failed to delete notification (Status: ${response.status})`;
      let errorBody = '';
      try {
        errorBody = await response.text();
        console.error(`[NotificationService] deleteNotification failed: Status ${response.status}, Body: ${errorBody}`);
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = JSON.parse(errorBody);
          errorMsg = errorData.error || errorMsg;
        }
      } catch (e) {
        console.error(`[NotificationService] Failed to read or parse error body:`, e);
      }
      throw new Error(errorMsg);
    }

    // Handle unexpected OK responses that are not 204
    console.warn(`[NotificationService] deleteNotification received unexpected OK status: ${response.status} for id: ${notificationId}`);

  } catch (error) {
    console.error('[NotificationService] deleteNotification error:', error);
    throw error;
  }
}

// Helper to get icon based on notification type
function getIconForType(type: string): string {
  switch (type) {
    case 'feeding':
      return 'utensils';
    case 'household':
      return 'users';
    case 'warning':
      return 'alert-triangle';
    case 'error':
      return 'alert-circle';
    case 'info':
    case 'system':
    default:
      return 'bell';
  }
}

/**
 * Schedule a notification for future delivery.
 * @param payload { type, title, message, deliverAt, catId }
 * @returns The created scheduled notification record.
 */
export async function scheduleNotification(payload: {
  type: string;
  title: string;
  message: string;
  deliverAt: string;
  catId?: string;
}) {
  const logContext = { event: 'scheduleNotification', payload, timestamp: new Date().toISOString() };
  console.log('[NotificationService] scheduleNotification called', logContext);
  try {
    const res = await fetch('/api/scheduled-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    console.log('[NotificationService] scheduleNotification fetch completed', { status: res.status });
    if (!res.ok) {
      let errorMsg = 'Scheduling failed';
      try {
        const err = await res.json();
        errorMsg = err.error || errorMsg;
      } catch {}
      console.error('[NotificationService] scheduleNotification error', { ...logContext, status: res.status, error: errorMsg });
      throw new Error(errorMsg);
    }
    const data = await res.json();
    console.log('[NotificationService] scheduleNotification success', { ...logContext, response: data });
    return data;
  } catch (err) {
    console.error('[NotificationService] scheduleNotification exception', { ...logContext, error: err });
    throw err;
  }
}

/**
 * Trigger delivery of due scheduled notifications (internal/server-side use).
 * @returns { delivered: number, notifications: ScheduledNotification[] }
 */
export async function deliverScheduledNotifications() {
  const logContext = { event: 'deliverScheduledNotifications', timestamp: new Date().toISOString() };
  console.log('[NotificationService] deliverScheduledNotifications called', logContext);
  try {
    const res = await fetch('/api/scheduled-notifications/deliver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    console.log('[NotificationService] deliverScheduledNotifications fetch completed', { status: res.status });
    if (!res.ok) {
      let errorMsg = 'Delivery failed';
      try {
        const err = await res.json();
        errorMsg = err.error || errorMsg;
      } catch {}
      console.error('[NotificationService] deliverScheduledNotifications error', { ...logContext, status: res.status, error: errorMsg });
      throw new Error(errorMsg);
    }
    const data = await res.json();
    console.log('[NotificationService] deliverScheduledNotifications success', { ...logContext, response: data });
    return data;
  } catch (err) {
    console.error('[NotificationService] deliverScheduledNotifications exception', { ...logContext, error: err });
    throw err;
  }
}
