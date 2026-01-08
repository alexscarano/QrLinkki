/**
 * Error Tracking Setup
 * 
 * Preparado para integração futura com Sentry, Bugsnag ou similar.
 * Por enquanto, apenas exporta funções placeholder.
 * 
 * Para usar Sentry:
 *   1. npm install @sentry/react-native
 *   2. Descomente e configure o código abaixo
 *   3. Adicione SENTRY_DSN ao .env
 */

// import * as Sentry from '@sentry/react-native';

let isInitialized = false;

/**
 * Inicializa error tracking (Sentry, Bugsnag, etc)
 */
export function initErrorTracking() {
  if (isInitialized) {
    return;
  }

  // TODO: Implementar quando configurar Sentry
  // if (!__DEV__) {
  //   const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  //   if (dsn) {
  //     Sentry.init({
  //       dsn,
  //       environment: process.env.BUILD_ENV || 'production',
  //       enableAutoSessionTracking: true,
  //       tracesSampleRate: 1.0,
  //       beforeSend(event) {
  //         // Filtra eventos em desenvolvimento
  //         if (__DEV__) {
  //           return null;
  //         }
  //         return event;
  //       },
  //     });
  //     isInitialized = true;
  //   }
  // }
}

/**
 * Captura exceção manualmente
 */
export function captureException(error: Error, context?: Record<string, any>) {
  // TODO: Implementar quando configurar Sentry
  // if (isInitialized) {
  //   Sentry.captureException(error, {
  //     extra: context,
  //   });
  // }
  
  // Por enquanto, apenas loga
  if (__DEV__) {
    console.error('[Error Tracking]', error, context);
  }
}

/**
 * Captura mensagem manualmente
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  // TODO: Implementar quando configurar Sentry
  // if (isInitialized) {
  //   Sentry.captureMessage(message, {
  //     level: level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info',
  //     extra: context,
  //   });
  // }
  
  // Por enquanto, apenas loga
  if (__DEV__) {
    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'info']('[Error Tracking]', message, context);
  }
}

/**
 * Adiciona contexto adicional para próximos eventos
 */
export function setContext(key: string, context: Record<string, any>) {
  // TODO: Implementar quando configurar Sentry
  // if (isInitialized) {
  //   Sentry.setContext(key, context);
  // }
}

/**
 * Adiciona tag para próximos eventos
 */
export function setTag(key: string, value: string) {
  // TODO: Implementar quando configurar Sentry
  // if (isInitialized) {
  //   Sentry.setTag(key, value);
  // }
}

// Inicializa automaticamente quando módulo é carregado
initErrorTracking();
