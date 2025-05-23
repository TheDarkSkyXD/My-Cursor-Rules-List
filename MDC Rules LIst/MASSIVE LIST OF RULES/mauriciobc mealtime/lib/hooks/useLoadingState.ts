"use client";

import { useEffect, useState } from 'react';
import { useLoading } from '@/lib/context/LoadingContext';

interface UseLoadingStateOptions {
  id?: string;
  description?: string;
  priority?: number;
}

export function useLoadingState(isLoading: boolean, options: UseLoadingStateOptions = {}) {
  const { addLoadingOperation, removeLoadingOperation } = useLoading();
  const [stableId] = useState(() => options.id || Math.random().toString(36).substring(7));
  const { description, priority } = options;

  useEffect(() => {
    if (isLoading) {
      addLoadingOperation({ id: stableId, description, priority });
    } else {
      removeLoadingOperation(stableId);
    }

    return () => {
      removeLoadingOperation(stableId);
    };
  }, [isLoading, stableId, description, priority, addLoadingOperation, removeLoadingOperation]);

  return { id: stableId };
} 