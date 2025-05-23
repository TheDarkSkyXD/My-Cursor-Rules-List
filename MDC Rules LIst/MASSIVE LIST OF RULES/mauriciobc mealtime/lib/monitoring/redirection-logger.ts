import { logger } from './logger';

interface RedirectionContext {
  sourceUrl: string;
  targetUrl: string;
  reason: string;
  userId?: string;
  statusCode: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class RedirectionLogger {
  private static instance: RedirectionLogger;

  private constructor() {}

  static getInstance(): RedirectionLogger {
    if (!RedirectionLogger.instance) {
      RedirectionLogger.instance = new RedirectionLogger();
    }
    return RedirectionLogger.instance;
  }

  logRedirection(context: RedirectionContext) {
    logger.info('Redirection occurred', {
      ...context,
      type: 'redirection',
      environment: process.env.NODE_ENV,
    });
  }

  logAuthRedirection(sourceUrl: string, userId?: string) {
    this.logRedirection({
      sourceUrl,
      targetUrl: '/login',
      reason: 'Authentication required',
      userId,
      statusCode: 302,
      timestamp: new Date().toISOString(),
      metadata: {
        requiresAuth: true,
        isAuthRedirect: true,
      },
    });
  }

  logNotFoundRedirection(sourceUrl: string, userId?: string) {
    this.logRedirection({
      sourceUrl,
      targetUrl: '/404',
      reason: 'Resource not found',
      userId,
      statusCode: 404,
      timestamp: new Date().toISOString(),
      metadata: {
        isNotFound: true,
      },
    });
  }

  logCustomRedirection(sourceUrl: string, targetUrl: string, reason: string, userId?: string, metadata?: Record<string, unknown>) {
    this.logRedirection({
      sourceUrl,
      targetUrl,
      reason,
      userId,
      statusCode: 302,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }
}

export const redirectionLogger = RedirectionLogger.getInstance(); 