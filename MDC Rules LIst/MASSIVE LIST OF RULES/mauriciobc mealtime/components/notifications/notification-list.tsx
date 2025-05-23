"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useNotifications } from '@/lib/context/NotificationContext';
import { NotificationItem } from './notification-item';
import { GlobalLoading } from '@/components/ui/global-loading';
import { useLoadingState } from '@/lib/hooks/useLoadingState';

export function NotificationList() {
  const { 
    notifications, 
    isLoading, 
    error, 
    hasMore, 
    loadMore 
  } = useNotifications();
  
  // Register loading state
  useLoadingState(isLoading, {
    description: 'Carregando notificações...',
    priority: 3, // Lower priority than auth/critical operations
  });

  const observer = useRef<IntersectionObserver>();
  const lastNotificationRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, loadMore]);

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Nenhuma notificação encontrada
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          ref={index === notifications.length - 1 ? lastNotificationRef : undefined}
        >
          <NotificationItem notification={notification} />
        </div>
      ))}
      
      {isLoading && (
        <div className="flex justify-center p-4">
          <GlobalLoading mode="spinner" size="md" text="Carregando mais..." />
        </div>
      )}
    </div>
  );
} 