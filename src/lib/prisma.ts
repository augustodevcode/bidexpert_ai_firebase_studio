// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { tenantContext } from './tenant-context';

// Prisma Client Singleton
const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prismaBase = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prismaBase;
}

// Multi-Tenancy Logic

const tenantAgnosticModels: Set<string> = new Set([
  'User', 'Tenant', 'Role', 'UsersOnTenants', 'UsersOnRoles',
  'LotCategory', 'Subcategory', 'State', 'City', 'Court',
  'DocumentType', 'VehicleMake', 'VehicleModel', 'PlatformSettings',
  'DocumentTemplate', 'ContactMessage'
]);

/**
 * Returns a Prisma Client instance extended with multi-tenancy logic.
 * It automatically filters queries based on the tenantId from the AsyncLocalStorage context.
 * This should be used for all repository/service layer access to tenant-specific data.
 * @returns {PrismaClient} An extended Prisma Client instance.
 */
export const getPrismaInstance = () => {
    const tenantId = tenantContext.getStore()?.tenantId;

    if (!tenantId) {
        // When no tenant is in context, return the base client.
        // This is useful for global operations or scripts, but services should generally expect a tenant context.
        return prismaBase;
    }

    return prismaBase.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    if (model && !tenantAgnosticModels.has(model)) {
                        const where = (args as any).where || {};
                        
                        if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy', 'update', 'delete'].includes(operation)) {
                            (args as any).where = { ...where, tenantId };
                        } else if (['updateMany', 'deleteMany'].includes(operation)) {
                             (args as any).where = { ...where, tenantId };
                        } else if (operation === 'create') {
                            (args as any).data = { ...(args as any).data, tenantId };
                        } else if (operation === 'createMany' && Array.isArray((args as any).data)) {
                             (args as any).data.forEach((item: any) => item.tenantId = tenantId);
                        } else if (operation === 'upsert') {
                            (args as any).where = { ...where, tenantId };
                            (args as any).create = { ...(args as any).create, tenantId };
                            (args as any).update = { ...(args as any).update, tenantId };
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
 * Should only be used for accessing tenant-agnostic models or in scripts
 * where tenant context is not available/applicable.
 */
export const prisma = prismaBase;
