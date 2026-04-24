enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

export interface LogContext {
  module?: string;
  userId?: string;
  requestId?: string;
  ip?: string;
  [key: string]: any;
}

export interface LoggerOptions {
  level?: LogLevel;
  context?: LogContext;
  environment?: 'development' | 'production' | 'test';
}

class AppLogger {
  private level: LogLevel;
  private environment: string;
  private context: LogContext;
  private isBrowser: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || this.getLevelFromEnv();
    this.environment = options.environment || this.getEnvironment();
    this.context = options.context || {};
    this.isBrowser = typeof window !== 'undefined';
  }

  private getLevelFromEnv(): LogLevel {
    if (typeof window === 'undefined' && process.env.LOG_LEVEL) {
      const level = process.env.LOG_LEVEL.toLowerCase();
      return Object.values(LogLevel).includes(level as LogLevel) ? level as LogLevel : LogLevel.INFO;
    }
    return LogLevel.INFO;
  }

  private getEnvironment(): string {
    if (typeof window === 'undefined') {
      return process.env.NODE_ENV || 'development';
    }
    return 'browser';
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(this.context).length > 0 ? ` ${JSON.stringify(this.context)}` : '';
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';

    if (this.isBrowser) {
      return `[${timestamp}] [${level}]${contextStr} ${message}${metaStr}`;
    }

    const pid = typeof process !== 'undefined' ? process.pid : '';
    return `[${timestamp}] [${level}] [PID:${pid}]${contextStr} ${message}${metaStr}`;
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  trace(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      console.trace(this.formatMessage(LogLevel.TRACE, message, meta));
    }
  }

  withContext(context: LogContext): AppLogger {
    return new AppLogger({
      level: this.level,
      environment: this.environment as any,
      context: { ...this.context, ...context }
    });
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.TRACE];
    const currentIndex = levels.indexOf(this.level);
    const targetIndex = levels.indexOf(level);
    return targetIndex <= currentIndex;
  }
}

const logger = new AppLogger();

export default logger;
