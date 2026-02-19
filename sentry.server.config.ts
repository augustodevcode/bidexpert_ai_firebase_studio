import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  
  tracesSampleRate: 0.1,
  
  beforeSend(event, hint) {
    // SOMENTE ERROS
    if (event.level !== 'error' && event.level !== 'fatal') {
      return null;
    }
    
    return event;
  },
});
