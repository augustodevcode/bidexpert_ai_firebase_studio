
import { PrismaClient } from '@prisma/client';
import { auditMiddleware } from './audit-middleware';

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  let client = new PrismaClient({
    log: process.env.PRISMA_QUERY_LOG === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn'],
  });

  // Enable ITSM query monitoring unless explicitly disabled
  if (process.env.ITSM_QUERY_MONITOR_ENABLED !== 'false') {
    client = client.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const before = Date.now();
            let result;
            let success = true;
            let errorMessage = null;

            try {
              result = await query(args);
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
                  if (model !== 'ITSM_QueryLog') {
                    const queryString = JSON.stringify({
                      model,
                      action: operation,
                      args,
                    });

                    // Use raw query to avoid triggering middleware again
                    await client.$executeRaw`
                      INSERT INTO itsm_query_logs (query, duration, success, errorMessage, timestamp)
                      VALUES (${queryString}, ${duration}, ${success}, ${errorMessage}, NOW())
                    `;
                  }
                } catch (logError) {
                  // Silently fail logging - don't break the main query
                  console.error('Failed to log query:', logError);
                }
              }
            }

            return result;
          },
        },
      },
    }) as any;
  }

  // Apply audit middleware via Client Extension (Prisma v5+)
  if (process.env.AUDIT_TRAIL_ENABLED !== 'false') {
    return client.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // Adapt extension params to middleware signature
            const params = {
              model,
              action: operation,
              args,
              dataPath: [],
              runInTransaction: false,
            };
            
            const next = (p: any) => query(p.args);
            
            // Call the existing audit middleware
            return auditMiddleware(params as any, next);
          },
        },
      },
    }) as any;
  }
  
  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
