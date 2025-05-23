import { LogLevel } from '@/types/monitoring';
import { Singleton } from '../utils/singleton';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

class Logger extends Singleton<Logger> {
  private logLevel: LogLevel = 'info';

  public constructor() {
    super();
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatLog(level, message, context);
    
    // Em desenvolvimento, mostra logs coloridos no console
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        debug: '\x1b[36m', // Ciano
        info: '\x1b[32m',  // Verde
        warn: '\x1b[33m',  // Amarelo
        error: '\x1b[31m', // Vermelho
        reset: '\x1b[0m'
      };

      console.log(
        `${colors[level]}[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}${
          context ? ` ${JSON.stringify(context)}` : ''
        }${colors.reset}`
      );
    } else {
      // Em produção, usa formato JSON para fácil ingestão por ferramentas de log
      console.log(JSON.stringify(logEntry));
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  // Método especial para erros com stack trace
  logError(error: Error, context?: LogContext) {
    this.error(error.message, {
      ...context,
      stack: error.stack,
      name: error.name
    });
  }
}

// Export a default instance
export const logger = Logger.getInstance(); 