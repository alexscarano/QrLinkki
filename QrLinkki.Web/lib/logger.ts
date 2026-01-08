/**
 * Sistema de Logging Estruturado
 * 
 * Fornece logging com níveis, contexto e suporte para error tracking.
 * Em desenvolvimento: mostra logs no console e mantém em memória.
 * Em produção: envia apenas erros para serviços de tracking.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

class Logger {
  private isDevelopment = __DEV__;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private enableFileExport = false;

  /**
   * Log interno com estruturação
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? { ...context } : undefined,
      error: error
        ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
        : undefined,
    };

    // Adiciona aos logs em memória
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console (desenvolvimento)
    if (this.isDevelopment) {
      const prefix = `[${level.toUpperCase()}]`;
      const timestamp = new Date().toLocaleTimeString();

      switch (level) {
        case 'debug':
          console.debug(`${prefix} [${timestamp}] ${message}`, context || '', error || '');
          break;
        case 'info':
          console.info(`${prefix} [${timestamp}] ${message}`, context || '');
          break;
        case 'warn':
          console.warn(`${prefix} [${timestamp}] ${message}`, context || '');
          break;
        case 'error':
          console.error(`${prefix} [${timestamp}] ${message}`, context || '', error || '');
          break;
      }
    }

    // Em produção, enviar erros para serviço de tracking
    if (!this.isDevelopment && level === 'error') {
      this.sendToErrorTracking(entry);
    }
  }

  /**
   * Envia erro para serviço de tracking (Sentry, Bugsnag, etc)
   */
  private sendToErrorTracking(entry: LogEntry) {
    // Importa dinamicamente para evitar dependência obrigatória
    try {
      const { captureException } = require('./error-tracking');
      if (entry.error) {
        const error = new Error(entry.error.message);
        error.stack = entry.error.stack;
        error.name = entry.error.name || 'Error';
        captureException(error, entry.context);
      }
    } catch (e) {
      // Error tracking não configurado, ignora silenciosamente
    }
  }

  /**
   * Debug: informações detalhadas para desenvolvimento
   */
  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  /**
   * Info: informações gerais
   */
  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  /**
   * Warn: avisos que não impedem execução
   */
  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  /**
   * Error: erros que precisam atenção
   */
  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, context, error);
  }

  /**
   * Exporta logs para JSON (útil para debug)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Exporta logs para arquivo (desenvolvimento)
   */
  /**
   * Exporta logs para arquivo (desenvolvimento)
   */
  async exportToFile(filename?: string): Promise<void> {
    if (!this.isDevelopment) {
      this.warn('exportToFile: Only available in development');
      return;
    }

    try {
      const FileSystem = require('expo-file-system');
      const logsDir = `${FileSystem.documentDirectory}logs/`;

      // Garante que o diretório existe
      const dirInfo = await FileSystem.getInfoAsync(logsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(logsDir, { intermediates: true });
      }

      const name = filename || `app-${Date.now()}.json`;
      const filepath = logsDir + name;

      await FileSystem.writeAsStringAsync(filepath, this.exportLogs(), {
        encoding: FileSystem.EncodingType.UTF8
      });

      this.info(`Logs exported to: ${filepath}`);
      console.log('Log file path:', filepath);
    } catch (err) {
      console.error('Failed to export logs:', err);
      this.error('Failed to export logs', err as Error);
    }
  }

  /**
   * Limpa logs da memória
   */
  clear() {
    this.logs = [];
    if (this.isDevelopment) {
      this.debug('Logger cleared');
    }
  }

  /**
   * Retorna logs filtrados por nível
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  /**
   * Retorna estatísticas dos logs
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    this.logs.forEach((log) => {
      stats[log.level]++;
    });

    return stats;
  }
}

// Exporta instância singleton
export const logger = new Logger();

// Exporta tipos para uso externo
export type { LogLevel, LogEntry };
