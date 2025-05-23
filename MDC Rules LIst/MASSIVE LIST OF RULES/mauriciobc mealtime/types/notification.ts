// Notification Types
export type NotificationType = 
  | 'feeding'    // Notificações de alimentação
  | 'reminder'   // Lembretes de alimentação
  | 'household'  // Notificações relacionadas a membros da casa
  | 'system'     // Notificações do sistema
  | 'info'       // Informações gerais
  | 'warning'    // Avisos
  | 'error';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  userId: number;
  catId?: number;
  householdId?: number;
  actionUrl?: string;
  icon?: string;
  timestamp?: Date;
  data?: {
    catId?: number;
    userId?: number;
    scheduledTime?: string;
    [key: string]: any;
  };
}

export interface CreateNotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  userId: number;
  catId?: number;
  householdId?: number;
  actionUrl?: string;
  icon?: string;
  data?: {
    scheduleId?: number;
    catId?: number;
    userId?: number;
    scheduledTime?: string;
    [key: string]: any;
  };
}
