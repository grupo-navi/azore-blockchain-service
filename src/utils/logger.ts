/**
 * Sistema de logging simples para o Azore Service
 * Pode ser substituído por Winston, Pino ou outro logger mais robusto
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  HTTP = 3,
  VERBOSE = 4,
  DEBUG = 5,
  SILLY = 6,
}

class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(prefix: string = 'AzoreService') {
    this.prefix = prefix;
    this.level = this.parseLogLevel(process.env.LOG_LEVEL || 'info');
  }

  private parseLogLevel(level: string): LogLevel {
    const levelMap: Record<string, LogLevel> = {
      error: LogLevel.ERROR,
      warn: LogLevel.WARN,
      info: LogLevel.INFO,
      http: LogLevel.HTTP,
      verbose: LogLevel.VERBOSE,
      debug: LogLevel.DEBUG,
      silly: LogLevel.SILLY,
    };

    return levelMap[level.toLowerCase()] ?? LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${this.prefix}] ${level}: ${message}${metaStr}`;
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message, meta));
    }
  }

  http(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.HTTP)) {
      console.log(this.formatMessage('HTTP', message, meta));
    }
  }

  verbose(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.VERBOSE)) {
      console.log(this.formatMessage('VERBOSE', message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, meta));
    }
  }

  silly(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.SILLY)) {
      console.log(this.formatMessage('SILLY', message, meta));
    }
  }

  setLevel(level: LogLevel | string): void {
    if (typeof level === 'string') {
      this.level = this.parseLogLevel(level);
    } else {
      this.level = level;
    }
  }

  getLevel(): LogLevel {
    return this.level;
  }
}

// Exportar instância singleton
export const logger = new Logger();

// Exportar classe para criar loggers personalizados
export default Logger;
