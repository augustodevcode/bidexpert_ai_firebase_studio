/**
 * @fileoverview Instâncias Prisma com seleção dinâmica por tenant/subdomínio.
 * Inclui suporte a banco demo e proxy para roteamento automático por slug.
 *
 * BDD: Garantir que subdomínios como "demo" usem o banco correto sem alterar chamadas existentes.
 * TDD: Cobrir seleção de cliente Prisma por subdomínio com testes unitários.
 */

import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';
import { auditMiddleware } from './audit-middleware';

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
  demoPrisma: ReturnType<typeof createPrismaClient> | undefined;
};

/**
 * Cria uma instância do Prisma Client com suporte a extensões e logs.
 */
function createPrismaClient(databaseUrl?: string) {
  const options: any = {
    log: process.env.PRISMA_QUERY_LOG === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn'],
  };

  if (databaseUrl) {
    options.datasources = {
      db: {
        url: databaseUrl,
      },
    };
  }

  let client = new PrismaClient(options);

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

              // Log all queries for debugging purposes
              // The threshold can be adjusted via env var strictly if needed
              const threshold = process.env.QUERY_LOG_THRESHOLD ? parseInt(process.env.QUERY_LOG_THRESHOLD) : 0;
              
              if (duration >= threshold || !success) {
                try {
                  // Avoid infinite loop - don't log the logging query itself
                  if (model !== 'ITSM_QueryLog') {
                    // Serialize with BigInt support
                    const queryString = JSON.stringify({
                      model,
                      action: operation,
                      args,
                    }, (key, value) =>
                      typeof value === 'bigint' ? value.toString() : value
                    );

                    // Use raw query to avoid triggering middleware again
                    // Using default(now()) for timestamp in schema, so we can omit it or pass it.
                    // But we want the exact time of execution.
                    // We also need to map the table correcty.
                    // The schema @@map("itsm_query_logs") means the table is `itsm_query_logs`.
                    
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

// Cliente Principal (Production/Default)
const basePrisma = globalForPrisma.prisma ?? createPrismaClient();

// Cliente Demo (Opcional)
export const demoPrisma = globalForPrisma.demoPrisma ?? (process.env.DATABASE_URL_DEMO
  ? createPrismaClient(process.env.DATABASE_URL_DEMO)
  : null);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma;
  if (demoPrisma) globalForPrisma.demoPrisma = demoPrisma;
}

// Alias para compatibilidade
export const mainPrisma = basePrisma;

/**
 * Helper para obter o cliente correto manualmente se necessário
 * Nota: A detecção automática de tenant foi removida para evitar problemas de compilação.
 * Use este helper explicitamente quando precisar do cliente demo.
 */
export function getPrismaClientBySubdomain(subdomain?: string | null) {
  if (subdomain?.toLowerCase() === 'demo' && demoPrisma) {
    return demoPrisma;
  }
  return mainPrisma;
}

function resolveSubdomainFromHeaders(): string | null {
  try {
    const headersList = headers();
    const subdomain = headersList.get('x-tenant-subdomain');
    return subdomain ? subdomain.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function getPrismaInstance(subdomain?: string | null) {
  const resolvedSubdomain = subdomain ?? resolveSubdomainFromHeaders();
  return getPrismaClientBySubdomain(resolvedSubdomain);
}

const prismaProxy = new Proxy(basePrisma, {
  get(_target, prop) {
    const client = getPrismaInstance();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
}) as PrismaClient;

export const prisma = prismaProxy;

export default prismaProxy;
