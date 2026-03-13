/**
 * @fileoverview Server Actions para CRUD de Tenant no Admin Plus.
 * Usa prisma diretamente pois TenantService não possui list/update/delete individual.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { createTenantSchema, updateTenantSchema } from './schema';
import { z } from 'zod';
import { slugify } from '@/lib/ui-helpers';

/* ─── List ─── */
export const listTenantsAction = createAdminAction({
  requiredPermission: 'tenants:read',
  handler: async () => {
    const tenants = await prisma.tenant.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        subdomain: true,
        domain: true,
        resolutionStrategy: true,
        status: true,
        maxUsers: true,
        maxAuctions: true,
        planId: true,
        createdAt: true,
      },
    });
    const serialized = tenants.map((t) => ({
      ...t,
      id: t.id.toString(),
    }));
    return { data: serialized, total: serialized.length, page: 1, pageSize: serialized.length, totalPages: 1 };
  },
});

/* ─── Get by ID ─── */
const getByIdSchema = z.object({ id: z.string() });

export const getTenantByIdAction = createAdminAction({
  inputSchema: getByIdSchema,
  requiredPermission: 'tenants:read',
  handler: async ({ input }) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: BigInt(input.id) },
    });
    if (!tenant) throw new Error('Tenant não encontrado');
    return {
      ...tenant,
      id: tenant.id.toString(),
      maxStorageBytes: tenant.maxStorageBytes?.toString() ?? null,
    };
  },
});

/* ─── Create ─── */
export const createTenantAction = createAdminAction({
  inputSchema: createTenantSchema,
  requiredPermission: 'tenants:create',
  handler: async ({ input }) => {
    const cleanSubdomain = slugify(input.subdomain);

    const existing = await prisma.tenant.findUnique({
      where: { subdomain: cleanSubdomain },
    });
    if (existing) {
      throw new Error(`Subdomínio '${cleanSubdomain}' já está em uso.`);
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: input.name,
        subdomain: cleanSubdomain,
        domain: input.domain ?? null,
        resolutionStrategy: input.resolutionStrategy ?? 'SUBDOMAIN',
        status: input.status ?? 'PENDING',
        planId: input.planId ?? null,
        maxUsers: input.maxUsers ?? 5,
        maxStorageBytes: input.maxStorageBytes ? BigInt(input.maxStorageBytes) : BigInt(1073741824),
        maxAuctions: input.maxAuctions ?? 10,
        updatedAt: new Date(),
      },
    });

    return { id: tenant.id.toString() };
  },
});

/* ─── Update ─── */
const updateInputSchema = z.object({ id: z.string(), data: updateTenantSchema });

export const updateTenantAction = createAdminAction({
  inputSchema: updateInputSchema,
  requiredPermission: 'tenants:update',
  handler: async ({ input }) => {
    const { id, data } = input;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.subdomain !== undefined) updateData.subdomain = slugify(data.subdomain);
    if (data.domain !== undefined) updateData.domain = data.domain;
    if (data.resolutionStrategy !== undefined) updateData.resolutionStrategy = data.resolutionStrategy;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.planId !== undefined) updateData.planId = data.planId;
    if (data.maxUsers !== undefined) updateData.maxUsers = data.maxUsers;
    if (data.maxStorageBytes !== undefined) {
      updateData.maxStorageBytes = data.maxStorageBytes ? BigInt(data.maxStorageBytes) : null;
    }
    if (data.maxAuctions !== undefined) updateData.maxAuctions = data.maxAuctions;

    await prisma.tenant.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return { id };
  },
});

/* ─── Delete ─── */
const deleteInputSchema = z.object({ id: z.string() });

export const deleteTenantAction = createAdminAction({
  inputSchema: deleteInputSchema,
  requiredPermission: 'tenants:delete',
  handler: async ({ input }) => {
    await prisma.tenant.delete({
      where: { id: BigInt(input.id) },
    });
    return { id: input.id };
  },
});
