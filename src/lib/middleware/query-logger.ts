// Query Logger Middleware for Prisma
// This middleware logs all database queries to the ITSM_QueryLog table

import { Prisma } from '@prisma/client';

export function createQueryLoggerMiddleware(prismaClient: any) {
  return async (params: Prisma.MiddlewareParams, next: any) => {
    const before = Date.now();
    let result;
    let success = true;
    let errorMessage = null;

    try {
      result = await next(params);
    } catch (error: any) {
      success = false;
      errorMessage = error?.message || 'Unknown error';
      throw error;
    } finally {
      const after = Date.now();
      const duration = after - before;

      // Only log queries that take longer than 100ms or failed queries
      if (duration > 100 || !success) {
        try {
          // Avoid infinite loop - don't log the logging query itself
          if (params.model !== 'ITSM_QueryLog') {
            const query = JSON.stringify({
              model: params.model,
              action: params.action,
              args: params.args,
            });

            // Use raw query to avoid triggering middleware again
            await prismaClient.$executeRaw`
              INSERT INTO itsm_query_logs (query, duration, success, errorMessage, timestamp)
              VALUES (${query}, ${duration}, ${success}, ${errorMessage}, NOW())
            `;
          }
        } catch (logError) {
          // Silently fail logging - don't break the main query
          console.error('Failed to log query:', logError);
        }
      }
    }

    return result;
  };
}
