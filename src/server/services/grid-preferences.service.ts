/**
 * @fileoverview Serviço servidor para preferências persistidas do SuperGrid.
 * Centraliza leitura e gravação de filtros avançados salvos por tenant e usuário.
 */

import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/server/lib/session';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import {
  readSavedGridFilters,
  removeSavedGridFilter,
  upsertSavedGridFilter,
  type SavedGridFilter,
} from '@/components/super-grid/utils/savedFilterHelpers';

const SaveGridFilterSchema = z.object({
  gridId: z.string().min(1),
  filterId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(120),
  query: z.record(z.unknown()),
});

const DeleteGridFilterSchema = z.object({
  gridId: z.string().min(1),
  filterId: z.string().min(1),
});

async function getCurrentPreferencesContext() {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error('Usuário não autenticado.');
  }

  const tenantId = await getTenantIdFromRequest();
  const tenantIdBigInt = BigInt(tenantId);
  const userId = BigInt(session.userId);

  const [tenant, userTenant] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantIdBigInt },
      select: { metadata: true },
    }),
    prisma.userOnTenant.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: tenantIdBigInt,
        },
      },
      select: { userId: true },
    }),
  ]);

  if (!tenant) {
    throw new Error('Tenant não encontrado.');
  }

  if (!userTenant) {
    throw new Error('Usuário sem acesso ao tenant atual.');
  }

  return {
    tenantId,
    tenantIdBigInt,
    userId,
    userScopeId: userId.toString(),
    preferences: tenant.metadata,
  };
}

export async function getSavedGridFiltersForCurrentUser(gridId: string): Promise<SavedGridFilter[]> {
  const validatedGridId = z.string().min(1).parse(gridId);
  const { userScopeId, preferences } = await getCurrentPreferencesContext();

  return readSavedGridFilters(preferences, userScopeId, validatedGridId);
}

export async function saveGridFilterForCurrentUser(
  input: z.infer<typeof SaveGridFilterSchema>
): Promise<SavedGridFilter> {
  const validated = SaveGridFilterSchema.parse(input);
  const { tenantIdBigInt, userScopeId, preferences } = await getCurrentPreferencesContext();

  const { preferences: nextPreferences, savedFilter } = upsertSavedGridFilter(
    preferences,
    userScopeId,
    validated.gridId,
    {
      filterId: validated.filterId,
      name: validated.name,
      query: validated.query,
    }
  );

  await prisma.tenant.update({
    where: { id: tenantIdBigInt },
    data: {
      metadata: nextPreferences as Prisma.InputJsonValue,
      updatedAt: new Date(),
    },
  });

  return savedFilter;
}

export async function deleteGridFilterForCurrentUser(
  input: z.infer<typeof DeleteGridFilterSchema>
): Promise<void> {
  const validated = DeleteGridFilterSchema.parse(input);
  const { tenantIdBigInt, userScopeId, preferences } = await getCurrentPreferencesContext();

  const nextPreferences = removeSavedGridFilter(
    preferences,
    userScopeId,
    validated.gridId,
    validated.filterId
  );

  await prisma.tenant.update({
    where: { id: tenantIdBigInt },
    data: {
      metadata: nextPreferences as Prisma.InputJsonValue,
      updatedAt: new Date(),
    },
  });
}