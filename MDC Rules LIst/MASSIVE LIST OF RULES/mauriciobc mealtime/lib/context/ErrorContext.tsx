"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/monitoring/logger'; // Import the logger

interface ErrorState {
  error: any | null;
  hasError: boolean;
}

// Add options to reportError function
interface ReportErrorOptions {
  showToast?: boolean;
}

interface ErrorContextProps extends ErrorState {
  reportError: (error: any, contextInfo?: Record<string, any>, options?: ReportErrorOptions) => void; // Updated signature
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextProps | undefined>(undefined);

const initialState: ErrorState = {
  error: null,
  hasError: false,
};

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ErrorState>(initialState);

  const reportError = useCallback((error: any, contextInfo?: Record<string, any>, options?: ReportErrorOptions) => {
    const showErrorToast = options?.showToast ?? true; // Default to true if option not provided

    // Use logger.logError if it's an Error object, otherwise logger.error
    if (error instanceof Error) {
      logger.logError(error, contextInfo);
    } else {
      // Attempt to stringify non-Error types for logging
      const message = typeof error === 'string' ? error : JSON.stringify(error);
      logger.error(`Error Reported: ${message}`, contextInfo);
    }
    // TODO: Integrate with a proper external logging service (e.g., Sentry, LogRocket)

    setState({ error: error, hasError: true });

    // Conditionally show the generic error toast
    if (showErrorToast) {
      toast.error("Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.");
    }

    // Optionally, you could try to extract a user-friendly message
    // const message = error?.message || "An unexpected error occurred.";
    // toast.error(message);

  }, []);

  const clearError = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <ErrorContext.Provider value={{ ...state, reportError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextProps => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// Optional: ErrorBoundary component using the context
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback UI
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any | null; // Store the error object
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static contextType = ErrorContext; // Use static contextType
  declare context: React.ContextType<typeof ErrorContext>; // Declare context type

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    // Use the context to report the error centrally, ensuring the toast is shown
    this.context?.reportError(error, { componentStack: errorInfo.componentStack }, { showToast: true });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div>
          <h2>Algo deu errado.</h2>
          <p>Pedimos desculpas pelo inconveniente.</p>
          {/* Optionally display error details in dev mode */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
             <details style={{ whiteSpace: 'pre-wrap' }}>
                {this.state.error.toString()}
                <br />
                {/* Consider adding componentStack here if needed */}
             </details>
           )}
           {/* Add a button to clear the error state */}
           <button onClick={() => this.context?.clearError()}>Tentar novamente</button>
        </div>
      );
    }

    return this.props.children;
  }
}