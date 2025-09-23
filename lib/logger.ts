interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  url?: string;
  [key: string]: any;
}

class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(this.context).length > 0 
      ? `[${Object.entries(this.context).map(([k, v]) => `${k}=${v}`).join(', ')}]` 
      : '';
    
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
    
    return `${timestamp} [${level}]${contextStr} ${message}${dataStr}`;
  }

  info(message: string, data?: any): void {
    console.log(this.formatMessage('INFO', message, data));
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatMessage('WARN', message, data));
  }

  error(message: string, error?: Error | any, data?: any): void {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack, name: error.name }
      : error;
    
    console.error(this.formatMessage('ERROR', message, { ...data, error: errorData }));
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }

  // Create a child logger with additional context
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }
}

// Export a default logger instance
export const logger = new Logger();

// Export the Logger class for creating custom loggers
export { Logger };
export type { LogContext };
