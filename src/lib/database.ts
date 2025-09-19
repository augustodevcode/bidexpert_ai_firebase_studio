// src/lib/database.ts
import { AsyncLocalStorage } from 'async_hooks';
import { PrismaClient } from '@prisma/client';

export const tenantContext = new AsyncLocalStorage<{ tenantId: string | null }>();

// Adicionando 'PlatformSettings' à lista de modelos que NÃO devem ter tenantId injetado automaticamente
// ATENÇÃO: Esta é uma decisão de design. Se PlatformSettings se tornasse por tenant, este modelo deveria ser removido da lista.
const tenantAgnosticModels: Set<string> = new Set([
  'User', 'Tenant', 'Role', 'UsersOnTenants', 'UsersOnRoles', 
  'LotCategory', 'Subcategory', 'State', 'City', 'Court', 
  'DocumentType', 'VehicleMake', 'VehicleModel',
  'DocumentTemplate', 'ContactMessage'
]);

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prismaBase = globalThis.prismaGlobal ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prismaBase;


export const getPrismaInstance = () => {
    const tenantId = tenantContext.getStore()?.tenantId;

    if (!tenantId) {
        console.warn("[getPrismaInstance] No tenantId found in context. Returning base Prisma client. This is expected for global operations or scripts.");
        return prismaBase;
    }

    return prismaBase.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    if (model && !tenantAgnosticModels.has(model)) {
                        const where = (args as any).where || {};
                        
                        if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                            (args as any).where = { ...where, tenantId };
                        } else if (operation === 'update') {
                             (args as any).where = { ...where, tenantId };
                        } else if (operation === 'updateMany') {
                             (args as any).where = { ...where, tenantId };
                        } else if (operation === 'delete') {
                             (args as any).where = { ...where, tenantId };
                        } else if (operation === 'deleteMany') {
                            (args as any).where = { ...where, tenantId };
                        } else if (operation === 'create') {
                            (args as any).data = { ...(args as any).data, tenantId };
                        } else if (operation === 'createMany' && Array.isArray((args as any).data)) {
                             (args as any).data.forEach((item: any) => item.tenantId = tenantId);
                        } else if (operation === 'upsert') {
                            (args as any).where = { ...where, tenantId };
                            (args as any).create = { ...(args as any).create, tenantId };
                        }
                    }
                    return query(args);
                },
            },
        },
    });
}

/**
 * The base, unmodified Prisma Client instance.
 * Should ONLY be used for accessing tenant-agnostic models or in scripts
 * where tenant context is not available/applicable.
 */
export const prisma = prismaBase;
