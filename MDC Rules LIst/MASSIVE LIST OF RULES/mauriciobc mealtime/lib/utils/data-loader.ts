import { useCallback, useEffect, useRef } from 'react';
import { useLoading } from '@/lib/hooks/use-loading';

interface LoaderOptions<T> {
  id: string;
  priority?: number;
  description?: string;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  dependencies?: any[];
  shouldLoad?: () => boolean;
}

interface LoaderState {
  isLoading: boolean;
  error: Error | null;
  hasAttemptedLoad: boolean;
}

export function useDataLoader<T>(
  fetchFn: () => Promise<T>,
  options: LoaderOptions<T>
) {
  const { addLoadingOperation, removeLoadingOperation } = useLoading();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const hasAttemptedLoadRef = useRef(false);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    removeLoadingOperation(options.id);
  }, [options.id, removeLoadingOperation]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const load = useCallback(async () => {
    if (options.shouldLoad && !options.shouldLoad()) {
      return;
    }

    if (hasAttemptedLoadRef.current) {
      return;
    }

    hasAttemptedLoadRef.current = true;
    cleanup();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    addLoadingOperation({
      id: options.id,
      priority: options.priority ?? 1,
      description: options.description ?? 'Loading data...'
    });

    try {
      const data = await fetchFn();

      if (!isMountedRef.current || abortController.signal.aborted) {
        return;
      }

      options.onSuccess?.(data);
    } catch (error: any) {
      if (!isMountedRef.current || error.name === 'AbortError') {
        return;
      }

      const errorMessage = error.message || 'Failed to load data';
      options.onError?.(new Error(errorMessage));
    } finally {
      if (isMountedRef.current) {
        cleanup();
      }
    }
  }, [fetchFn, options, addLoadingOperation, cleanup]);

  useEffect(() => {
    load();
  }, [...(options.dependencies || []), load]);

  return {
    reload: load,
    cleanup,
    hasAttemptedLoad: hasAttemptedLoadRef.current
  };
}

// Example usage:
/*
const { reload, cleanup } = useDataLoader(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  {
    id: 'load-data',
    priority: 1,
    description: 'Loading data...',
    onSuccess: (data) => setData(data),
    onError: (error) => setError(error),
    dependencies: [userId],
    shouldLoad: () => !!userId
  }
);
*/ 