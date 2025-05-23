"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X, Clock, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/lib/context/NotificationContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Notification, NotificationType } from "@/lib/types/notification";
import { NotificationItem } from "./notification-item";
import { useRouter } from "next/navigation";

export function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    refreshNotifications,
    isLoading 
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const router = useRouter();

  // Refresh notifications when the popover is opened
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isOpen && !isLoading) {
      const now = Date.now();
      // Only refresh if it's been more than 5 seconds since last refresh
      if (now - lastRefresh > 5000) {
        console.log(`[NotificationCenter] Popover opened, scheduling refresh`);
        timeoutId = setTimeout(() => {
          console.log(`[NotificationCenter] Executing debounced refresh`);
          refreshNotifications();
          setLastRefresh(now);
        }, 300);
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isOpen, refreshNotifications, isLoading, lastRefresh]);

  // Marcar todas as notificações como lidas
  const handleMarkAllAsRead = async () => {
    console.log(`[NotificationCenter] Marking all notifications as read`);
    try {
      await markAllAsRead();
      // Refresh notifications after marking all as read
      await refreshNotifications();
      toast.success("Todas as notificações foram marcadas como lidas");
      // Close the popover after successful action
      setIsOpen(false);
    } catch (error) {
      console.error(`[NotificationCenter] Error marking all notifications as read:`, error);
      toast.error(error instanceof Error ? error.message : "Não foi possível marcar todas as notificações como lidas");
    }
  };

  // Marcar uma notificação como lida
  const handleMarkAsRead = async (id: number) => {
    console.log(`[NotificationCenter] Marking notification as read:`, { id });
    try {
      await markAsRead(id);
      // Refresh notifications after marking as read
      await refreshNotifications();
      toast.success("Notificação marcada como lida");
    } catch (error) {
      console.error(`[NotificationCenter] Error marking notification as read:`, error);
      toast.error(error instanceof Error ? error.message : "Não foi possível marcar a notificação como lida");
    }
  };

  // Handle notification removal
  const handleRemoveNotification = async (id: number) => {
    console.log(`[NotificationCenter] Removing notification:`, { id });
    try {
      await removeNotification(id);
      // Close the popover after successful deletion
      setIsOpen(false);
      toast.success("Notificação removida");
    } catch (error) {
      console.error(`[NotificationCenter] Error removing notification:`, error);
      toast.error(error instanceof Error ? error.message : "Não foi possível remover a notificação");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          type,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create notification");
      }

      toast.success("Notificação criada com sucesso");
      router.push("/notifications");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar notificação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-medium">Notificações</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="relative group hover:bg-accent/50 rounded-lg p-2 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <NotificationItem 
                        notification={notification} 
                        onClick={() => setIsOpen(false)}
                        showActions={true}
                      />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:text-primary"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:text-destructive"
                        onClick={() => handleRemoveNotification(notification.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Link href="/notifications" className="w-full">
            <Button variant="ghost" className="w-full justify-start">
              Ver todas as notificações
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
} 