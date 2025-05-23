import { Singleton } from '../utils/singleton';
import { logger } from './logger';

class ErrorMonitor extends Singleton<ErrorMonitor> {
  private errors: Error[];
  private readonly MAX_ERROR_HISTORY = 100;

  public constructor() {
    super();
    this.errors = [];
  }

  logError(error: Error, context?: Record<string, unknown>): void {
    this.errors.push(error);
    if (this.errors.length > this.MAX_ERROR_HISTORY) {
      this.errors.shift();
    }
    logger.error(error.message, { ...context, stack: error.stack });
  }

  getErrors(): Error[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }
}

// Export a default instance
export const errorMonitor = ErrorMonitor.getInstance(); 