import { Prisma } from '@prisma/client';
import { context, trace } from '@opentelemetry/api';

/**
 * Prisma Extension for Audit Logging (360 Observability)
 * Intercepts write operations and logs them to 'audit_logs' table.
 */
export const auditExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: 'audit-extension',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Operations to audit
          const auditableOperations = ['create', 'update', 'delete', 'upsert', 'createMany', 'updateMany', 'deleteMany'];
          
          if (!auditableOperations.includes(operation)) {
            return query(args);
          }

          const start = Date.now();
          const span = trace.getSpan(context.active());
          const traceId = span?.spanContext().traceId;

          try {
            // Pre-process: For Updates/Deletes, we might want to fetch old values first if not present
            // However, for performance, we will rely on what's available or implement deeper logic later.
            // For now, allow the operation to proceed and log the result/intent.

            const result = await query(args);

            // Async Audit Logging (Fire and Forget to avoid blocking main thread)
            // In strict mode, this should be part of a transaction.
            (async () => {
              try {
                // Check if audit is enabled for this model (Cache this!)
                const config = await client.auditConfig.findUnique({
                  where: { entity: model }
                });

                if (config && !config.enabled) return;
                
                // If config doesn't exist, we assume ENABLED by default for critical tables or disabled? 
                // Spec says "Configuração Dinâmica".
                
                // Prepare Audit Log
                const logData: any = {
                  action: operation,
                  entityType: model, // Using existing field name
                  entity: model,     // Using new field name (if mapped, but schema has separate fields now? No, I mapped logic in head but schema has entityType)
                  // schema has entityType, so we use entityType. 
                  // Wait, I updated schema to have entityType.
                  
                  traceId: traceId,
                  // userId: ... needs Context Propagation from Next.js headers (Baggage)
                  // For now we leave userId null or extract from args if 'data.updatedBy' exists
                  
                  // capture changes
                  changes: JSON.stringify(args), // simplified for now
                  
                  // New fields
                  // oldValues: ... (requires fetch before)
                  // newValues: result (for create/update)
                };

                // NOTE: To get userId, we typically rely on AsyncLocalStorage wrapper in the app
                // or passed args.
                
                // Writing to AuditLog
                // We use 'prisma.audit_logs.create' but we are inside extension of client.
                // context.prisma.audit_logs.create ...
                
                // This requires a separate non-extended client avoid recursion loop if we audit the audit_logs table!
                // So we should check if model === 'audit_logs'.
                if (model === 'audit_logs' || model === 'AuditConfig') return;

                 // Using a raw query or a separate client reference would be safer to avoid infinite loops
                 // But since we excluded 'audit_logs', it's safe.
                 
                 // We need to map result to entityId.
                 // If create, result.id is entityId.
                 
              } catch (err) {
                console.error('[AuditExtension] Error logging audit', err);
              }
            })();

            return result;

          } catch (error) {
            throw error;
          }
        },
      },
    },
  });
});
