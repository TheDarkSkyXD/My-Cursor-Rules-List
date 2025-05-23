"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';

interface LoadingOperation {
  id: string;
  description?: string;
  priority?: number; // Lower number means higher priority
}

interface LoadingState {
  operations: LoadingOperation[];
}

interface LoadingContextType {
  state: LoadingState;
  isLoading: boolean;
  addLoadingOperation: (operation: LoadingOperation) => void;
  removeLoadingOperation: (id: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<LoadingState>({ operations: [] });

  const addLoadingOperation = useCallback((operation: LoadingOperation) => {
    setState((prevState) => {
      // Avoid adding duplicate IDs
      if (prevState.operations.some((op) => op.id === operation.id)) {
        return prevState;
      }
      const newOperations = [...prevState.operations, operation];
      // Sort by priority (lower first), then by addition order (implicit)
      newOperations.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
      return { operations: newOperations };
    });
  }, []);

  const removeLoadingOperation = useCallback((id: string) => {
    setState((prevState) => ({
      operations: prevState.operations.filter((op) => op.id !== id),
    }));
  }, []);

  // isLoading is true if there are any active operations
  const isLoading = state.operations.length > 0;

  // Memoize the context value
  const contextValue = useMemo(
    () => ({
      state,
      isLoading,
      addLoadingOperation,
      removeLoadingOperation,
    }),
    [state, isLoading, addLoadingOperation, removeLoadingOperation]
  );

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};