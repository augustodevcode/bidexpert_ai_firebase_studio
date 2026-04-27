/**
 * @fileoverview Server Actions genéricos do SuperGrid.
 * Implementa CRUD completo com paginação server-side, ordenação, filtros,
 * busca global, agregações e isolamento multi-tenant via getTenantIdFromRequest.
 * Suporta qualquer entidade Prisma via configuração parametrizada.
 */
'use server';

import { FetchParamsSchema } from '@/components/super-grid/SuperGrid.types';
import type { GridFetchParams, GridFetchResult } from '@/components/super-grid/SuperGrid.types';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { prisma } from '@/lib/prisma';
import { getGridDataService } from '@/server/services/grid-data.service';
import { sanitizeResponse } from '@/lib/serialization-helper';

function serializeData<T>(data: T): T {
  return sanitizeResponse(data);
}

/** Resolve o modelo Prisma dinamicamente a partir do nome da entidade */
function getPrismaModel(entity: string) {
  const key = entity.charAt(0).toLowerCase() + entity.slice(1);
  const model = (prisma as unknown as Record<string, unknown>)[key];

  if (!model) {
    throw new Error(`[SuperGrid] Entidade Prisma não encontrada: ${entity}. Verifique o nome do modelo.`);
  }

  return model as {
    findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
    count: (args: Record<string, unknown>) => Promise<number>;
    create: (args: Record<string, unknown>) => Promise<unknown>;
    update: (args: Record<string, unknown>) => Promise<unknown>;
    findUnique: (args: Record<string, unknown>) => Promise<unknown | null>;
    deleteMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
  };
}

/**
 * Busca dados paginados de qualquer entidade Prisma.
 * Server Action principal do SuperGrid.
 */
export async function fetchGridData(
  params: GridFetchParams
): Promise<GridFetchResult> {
  const validated = FetchParamsSchema.parse(params);
  const tenantId = await getTenantIdFromRequest();
  const startTime = Date.now();

  try {
    const result = await getGridDataService(validated, tenantId);
    const elapsed = Date.now() - startTime;

    console.log(
      `[SuperGrid] ${validated.entity}: ${result.totalCount} registros, página ${validated.pagination.pageIndex}, ${elapsed}ms`
    );

    return serializeData(result);
  } catch (error) {
    console.error(`[fetchGridData] Erro ao buscar dados da entidade ${validated.entity}:`, error);
    throw error;
  }
}

/** Salva (create ou update) um registro genérico */
export async function saveGridRow(
  entity: string,
  data: Record<string, unknown>,
  id?: string
): Promise<Record<string, unknown>> {
  try {
    const tenantId = await getTenantIdFromRequest();
    const model = getPrismaModel(entity);

    // Remover campos que não devem ser enviados ao Prisma
    const cleanData = { ...data };
    delete cleanData.id;
    delete cleanData.createdAt;
    delete cleanData.updatedAt;

    if (id) {
      // Update
      const existing = await model.findUnique({
        where: { id: BigInt(id) },
      });
      if (!existing) {
        throw new Error('Registro não encontrado');
      }
      const result = await model.update({
        where: { id: BigInt(id) },
        data: {
          ...cleanData,
          updatedAt: new Date(),
        },
      });
      return serializeData(result as Record<string, unknown>);
    } else {
      // Create
      const result = await model.create({
        data: {
          ...cleanData,
          tenantId: BigInt(tenantId),
          updatedAt: new Date(),
        },
      });
      return serializeData(result as Record<string, unknown>);
    }
  } catch (error) {
    console.error(`[SuperGrid] Error saving ${entity}:`, error);
    throw error;
  }
}

/** Deleta registros em lote com verificação de tenant */
export async function deleteGridRows(
  entity: string,
  ids: string[]
): Promise<{ deleted: number }> {
  try {
    const tenantId = await getTenantIdFromRequest();
    const model = getPrismaModel(entity);

    const bigIntIds = ids.map(id => BigInt(id));

    const result = await model.deleteMany({
      where: {
        id: { in: bigIntIds },
        tenantId: BigInt(tenantId),
      },
    });

    return { deleted: result.count };
  } catch (error) {
    console.error(`[SuperGrid] Error deleting ${entity}:`, error);
    throw error;
  }
}
