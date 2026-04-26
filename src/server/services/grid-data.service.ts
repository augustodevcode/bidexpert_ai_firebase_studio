/**
 * @fileoverview Service para busca de dados genérica do SuperGrid.
 * Centraliza a lógica de query Prisma para ser usada por Server Actions e API Routes.
 */

import { prisma } from '@/lib/prisma';
import { convertQueryBuilderToPrisma } from '@/components/super-grid/utils/prismaQueryBuilder';
import { buildGlobalSearchWhere } from '@/components/super-grid/utils/searchHelpers';
import type { GridFetchParams, GridFetchResult } from '@/components/super-grid/SuperGrid.types';
import { sanitizeResponse } from '@/lib/serialization-helper';

function getPrismaModel(entity: string) {
  const key = entity.charAt(0).toLowerCase() + entity.slice(1);
  const model = (prisma as unknown as Record<string, unknown>)[key];
  if (!model) {
    throw new Error(`[SuperGrid Service] Entidade Prisma não encontrada: ${entity}.`);
  }
  return model as {
    findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
    count: (args: Record<string, unknown>) => Promise<number>;
  };
}

export async function getGridDataService(
  params: GridFetchParams,
  tenantId: string
): Promise<GridFetchResult> {
  const model = getPrismaModel(params.entity);

  // 1. Construir WHERE
  let where: Record<string, unknown> = { tenantId: BigInt(tenantId) };

  // 1.1 Filtros do Query Builder
  if (params.filters && Object.keys(params.filters).length > 0) {
    const qbWhere = convertQueryBuilderToPrisma(
      params.filters as unknown as Parameters<typeof convertQueryBuilderToPrisma>[0]
    );
    if (Object.keys(qbWhere).length > 0) {
      where = { AND: [where, qbWhere] };
    }
  }

  // 1.2 Busca global
  if (params.globalFilter && params.globalFilter.trim() !== '') {
    const searchTerm = params.globalFilter.trim();
    const searchableFields = params.searchableColumns || ['title', 'name'];
    const orConditions = buildGlobalSearchWhere(searchableFields, searchTerm);

    if (orConditions.length > 0) {
      where = { AND: [where, { OR: orConditions }] };
    }
  }

  // 2. Ordenação
  const orderBy = params.sorting?.map(sort => {
    if (sort.id.includes('.')) {
      const parts = sort.id.split('.');
      let obj: Record<string, unknown> = { [parts[parts.length - 1]]: sort.desc ? 'desc' : 'asc' };
      for (let i = parts.length - 2; i >= 0; i--) {
        obj = { [parts[i]]: obj };
      }
      return obj;
    }
    return { [sort.id]: sort.desc ? 'desc' : 'asc' };
  }) || [{ createdAt: 'desc' }];

  // 3. Includes
  const include = params.includes || {};

  // 4. Execução
  const [data, totalCount] = await Promise.all([
    model.findMany({
      where,
      orderBy,
      include,
      take: params.pagination.pageSize,
      skip: params.pagination.pageIndex * params.pagination.pageSize,
    }),
    model.count({ where }),
  ]);

  return {
    data: sanitizeResponse(data),
    totalCount,
    pageCount: Math.ceil(totalCount / params.pagination.pageSize),
  };
}
