"use client";

import { Notification } from "@/lib/types/notification";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  Bell, 
  Utensils, 
  Users, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Trash2,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/lib/context/NotificationContext";

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  showActions?: boolean;
}

export function NotificationItem({ 
  notification, 
  onClick, 
  showActions = false 
}: NotificationItemProps) {
  const { removeNotification, isLoading, error } = useNotifications();
  const { id, title, message, type, is_read, created_at, metadata } = notification;
  
  // Defensive date formatting
  let timeAgo = '';
  const dateValue = notification.createdAt || notification.created_at;
  if (dateValue) {
    const dateObj = new Date(dateValue);
    if (!isNaN(dateObj.getTime())) {
      timeAgo = formatDistanceToNow(dateObj, { addSuffix: true });
    }
  }
  
  // Get the icon based on type
  const getIcon = () => {
    switch (type) {
      case 'feeding':
        return <Utensils className="h-5 w-5 text-primary" />;
      case 'household':
        return <Users className="h-5 w-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'info':
        return <Info className="h-5 w-5 text-primary" />;
      case 'system':
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  // Handle delete notification
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log(`[NotificationItem] Delete button clicked for notification:`, {
      id,
      title,
      is_read,
      type
    });
    try {
      await removeNotification(id);
    } catch (error) {
      console.error(`[NotificationItem] Error removing notification:`, error);
    }
  };
  
  const content = (
    <div 
      className={cn(
        "flex items-start gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
        !notification.isRead && "bg-muted/30"
      )}
      onClick={() => {
        if (notification.metadata?.actionUrl) {
          window.location.href = notification.metadata.actionUrl;
        }
        onClick?.(notification);
      }}
    >
      <div className="mt-1">{getIcon()}</div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-4">
          <p className={cn(
            "text-sm font-medium leading-none",
            !notification.isRead && "font-semibold"
          )}>
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
      </div>
      {showActions && (
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDelete}
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete notification</span>
        </Button>
      )}
    </div>
  );
  
  if (notification.metadata?.actionUrl) {
    return (
      <Link href={notification.metadata.actionUrl} className="block">
        {content}
      </Link>
    );
  }
  
  return content;
}
