type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  module?: string;
}

class Logger {
  private module: string;

  constructor(module: string = 'app') {
    this.module = module;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      module: this.module,
    };

    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${this.module}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message, context || '');
        break;
      case 'warn':
        console.warn(prefix, message, context || '');
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(prefix, message, context || '');
        }
        break;
      default:
        console.log(prefix, message, context || '');
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  child(module: string): Logger {
    return new Logger(`${this.module}:${module}`);
  }
}

export const logger = new Logger('onit-png');
export { Logger };
