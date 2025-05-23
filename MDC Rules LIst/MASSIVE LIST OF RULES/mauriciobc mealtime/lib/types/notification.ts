// Notification Types
export type NotificationType = 
  | 'feeding'    // Feeding notifications
  | 'reminder'   // Feeding reminders
  | 'household'  // Household member related notifications
  | 'system'     // System notifications
  | 'info'       // General information
  | 'warning'    // Warnings
  | 'error';     // Errors

export interface Notification {
  id: string;  // UUID
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;  // UUID
  metadata?: {
    catId?: string;  // UUID
    householdId?: string;  // UUID
    actionUrl?: string;
    icon?: string;
    scheduledTime?: string;
    [key: string]: any;
  };
}

export interface CreateNotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  // userId and householdId are now handled by the API route via headers
  // user_id: string;  // UUID - REMOVED
  metadata?: {
    catId?: string;  // UUID
    // householdId?: string;  // UUID - REMOVED (API should associate with user's household)
    actionUrl?: string;
    icon?: string;
    scheduledTime?: string;
    [key: string]: any;
  };
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  catId?: string;
  type: string;
  title: string;
  message: string;
  deliverAt: string; // ISO-8601
  delivered: boolean;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}
