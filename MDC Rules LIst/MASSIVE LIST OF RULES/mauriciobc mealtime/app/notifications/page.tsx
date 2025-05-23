"use client";

import React, { useState, useCallback, useMemo } from "react";
import { ArrowLeft, Bell, Calendar, Check, CheckCheck, Clock, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageTransition from "@/components/page-transition"; // Assuming this component exists
import { useNotifications } from "@/lib/context/NotificationContext";
import { Notification } from "@/lib/types/notification";
import { cn } from "@/lib/utils";
import { GlobalLoading } from "@/components/ui/global-loading";
import { useUserContext } from "@/lib/context/UserContext";
import { resolveDateFnsLocale } from "@/lib/utils/dateFnsLocale";
import { scheduleNotification } from '@/lib/services/notificationService';

// Re-usable Icon component
const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  const icons = {
    feeding: <Clock className="h-5 w-5 text-primary" />,
    reminder: <Calendar className="h-5 w-5 text-amber-500" />,
    system: <Bell className="h-5 w-5 text-blue-500" />,
  };
  return icons[type] || <Bell className="h-5 w-5 text-muted-foreground" />;
};

// Memoized Notification Item
const NotificationItem = React.memo(({
  notification,
  onMarkRead,
  onRemove,
  isProcessing,
  userLanguage,
}: {
  notification: Notification;
  onMarkRead: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  isProcessing: boolean;
  userLanguage?: string;
}) => {
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleMarkRead = async () => {
    setIsMarkingRead(true);
    try {
      await onMarkRead(notification.id);
      toast.success("Notificação marcada como lida.");
    } catch (err) {
      toast.error("Falha ao marcar como lida.");
      console.error("Error marking notification as read:", err);
    } finally {
      // No need to set isMarkingRead to false if the component might unmount/re-render on context update
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(notification.id);
      toast.success("Notificação removida.");
    } catch (err) {
      toast.error("Falha ao remover notificação.");
      console.error("Error removing notification:", err);
    } finally {
      // No need to set isRemoving to false if the component might unmount/re-render on context update
    }
  };

  // Defensive check for valid date
  const formattedDate = useMemo(() => {
    const date = new Date(notification.createdAt);
    if (isNaN(date.getTime())) return "";
    return format(date, "dd/MM/yyyy HH:mm");
  }, [notification.createdAt]);

  const isActionDisabled = isProcessing || isMarkingRead || isRemoving;

  return (
    <Card className={cn(
      "transition-colors duration-200",
      !notification.isRead && "border-primary/30 bg-primary/5",
      isActionDisabled && "opacity-70 pointer-events-none"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex-shrink-0">
            <NotificationIcon type={notification.type} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <h3 className="font-medium break-words">{notification.title}</h3>
                <p className="text-sm text-muted-foreground break-words">
                  {notification.message}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground flex-shrink-0 pt-0.5">
                {formattedDate}
              </div>
            </div>
            <div className="flex justify-end mt-2 gap-2">
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkRead}
                  className="text-xs h-8"
                  disabled={isActionDisabled}
                  aria-label="Marcar como lida"
                >
                  {isMarkingRead ? (
                    <GlobalLoading mode="spinner" size="sm" />
                  ) : (
                    <Check size={14} className="mr-1" />
                  )}
                  Marcar lida
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-xs text-destructive h-8 hover:bg-destructive/10"
                disabled={isActionDisabled}
                aria-label="Remover notificação"
              >
                {isRemoving ? (
                    <GlobalLoading mode="spinner" size="sm" />
                ) : (
                    <Trash2 size={14} className="mr-1" />
                )}
                Remover
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
NotificationItem.displayName = 'NotificationItem'; // Add display name for debugging

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    // refreshNotifications // Consider if manual refresh is needed
  } = useNotifications();
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const { state: userState } = useUserContext();
  const userLanguage = userState.currentUser?.preferences?.language;
  const userLocale = resolveDateFnsLocale(userLanguage);

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
      toast.success("Todas as notificações marcadas como lidas.");
    } catch (err) {
      toast.error("Falha ao marcar todas como lidas.");
      console.error("Error marking all notifications as read:", err);
    } finally {
      setIsMarkingAllRead(false);
    }
  }, [markAllAsRead, unreadCount]);

  const handleMarkRead = useCallback(async (id: string) => {
    await markAsRead(id); // Context handles loading/state updates
  }, [markAsRead]);

  const handleRemove = useCallback(async (id: string) => {
    await removeNotification(id); // Context handles loading/state updates
  }, [removeNotification]);

  const sortedNotifications = useMemo(() =>
    [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications]
  );

  const showMarkAllReadButton = unreadCount > 0 && !isLoading;
  const isProcessing = isLoading || isMarkingAllRead;

  return (
    <PageTransition>
      <div className="container max-w-3xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Notificações</h1>
          </div>

          {showMarkAllReadButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isProcessing}
              className="flex-shrink-0"
            >
              {isMarkingAllRead ? (
                <GlobalLoading mode="spinner" size="sm" />
              ) : (
                <CheckCheck size={16} className="mr-2" />
              )}
              <span>Marcar todas lidas ({unreadCount})</span>
            </Button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
            Erro ao carregar notificações: {String(error)}
          </div>
        )}

        {/* Loading State */}
        {isLoading && notifications.length === 0 && (
           <div className="flex justify-center items-center py-12">
              <GlobalLoading mode="spinner" size="lg" />
           </div>
        )}

        {/* Empty State */}
        {!isLoading && notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-6">
              Você não tem nenhuma notificação no momento.
            </p>
            <Button onClick={() => router.back()}>Voltar</Button>
          </div>
        )}

        {/* Notifications List */}
        {!isLoading && notifications.length > 0 && (
          <div className="space-y-3">
            {sortedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onRemove={handleRemove}
                isProcessing={isProcessing} // Pass overall processing state
                userLanguage={userLanguage}
              />
            ))}
          </div>
        )}

        {/* Optional: Add a subtle loading indicator when refreshing existing list */}
        {isLoading && notifications.length > 0 && (
           <div className="text-center py-4">
              <GlobalLoading mode="spinner" size="md" />
           </div>
        )}
      </div>
    </PageTransition>
  );
} 