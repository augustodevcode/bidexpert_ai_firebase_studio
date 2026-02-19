import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Ambiente
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% das transações
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // 100% quando há erro
  
  // Filtros - SOMENTE ERROS
  beforeSend(event, hint) {
    // Ignora warnings e info, apenas errors
    if (event.level !== 'error' && event.level !== 'fatal') {
      return null;
    }
    
    // Ignora erros conhecidos/esperados
    const ignoredErrors = [
      'ResizeObserver loop limit exceeded',
      'Network request failed',
      'Failed to fetch'
    ];
    
    const errorMessage = hint.originalException?.toString() || '';
    if (ignoredErrors.some(err => errorMessage.includes(err))) {
      return null;
    }
    
    return event;
  },
  
  // Integrations
  integrations: [
    Sentry.browserTracingIntegration({
      tracePropagationTargets: ["localhost", /^https:\/\/.*\.vercel\.app/],
    }),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
