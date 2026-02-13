/**
 * @fileoverview Server Actions genéricos do SuperGrid.
 * Implementa CRUD completo com paginação server-side, ordenação, filtros,
 * busca global, agregações e isolamento multi-tenant via getTenantIdFromRequest.
 * Suporta qualquer entidade Prisma via configuração parametrizada.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { convertQueryBuilderToPrisma } from '@/components/super-grid/utils/prismaQueryBuilder';
import { FetchParamsSchema } from '@/components/super-grid/SuperGrid.types';
import type { GridFetchParams, GridFetchResult } from '@/components/super-grid/SuperGrid.types';

// Serializer de BigInt para JSON
function bigIntReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

function serializeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, bigIntReplacer));
}

/** Resolve o modelo Prisma dinamicamente a partir do nome da entidade */
function getPrismaModel(entity: string) {
  // Normalizar: primeira letra minúscula para acessar prisma.auction, prisma.lot, etc.
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
    aggregate: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
}

/**
 * Busca dados paginados de qualquer entidade Prisma.
 * Server Action principal do SuperGrid.
 */
export async function fetchGridData(
  params: GridFetchParams
): Promise<GridFetchResult> {
  const startTime = Date.now();

  // 1. Validação
  const validated = FetchParamsSchema.parse(params);

  // 2. Multi-tenant isolation
  const tenantId = await getTenantIdFromRequest();

  // 3. Resolver modelo Prisma
  const model = getPrismaModel(validated.entity);

  // 4. Construir WHERE
  let where: Record<string, unknown> = { tenantId: BigInt(tenantId) };

  // 4.1 Filtros do Query Builder
  if (validated.filters && Object.keys(validated.filters).length > 0) {
    const qbWhere = convertQueryBuilderToPrisma(
      validated.filters as unknown as Parameters<typeof convertQueryBuilderToPrisma>[0]
    );
    if (Object.keys(qbWhere).length > 0) {
      where = { AND: [where, qbWhere] };
    }
  }

  // 4.2 Busca global (quick filter)
  if (validated.globalFilter && validated.globalFilter.trim() !== '') {
    const searchTerm = validated.globalFilter.trim();
    const searchableFields = validated.searchableColumns || ['title', 'name'];

    const orConditions = searchableFields.map(field => {
      // Para campos simples
      if (!field.includes('.')) {
        return { [field]: { contains: searchTerm } };
      }
      // Para campos aninhados (ex: 'Auctioneer.name')
      const parts = field.split('.');
      let condition: Record<string, unknown> = { [parts[parts.length - 1]]: { contains: searchTerm } };
      for (let i = parts.length - 2; i >= 0; i--) {
        condition = { [parts[i]]: condition };
      }
      return condition;
    });

    if (orConditions.length > 0) {
      const currentWhere = where;
      where = { AND: [currentWhere, { OR: orConditions }] };
    }
  }

  // 5. Construir ORDER BY
  const orderBy = validated.sorting?.map(sort => {
    if (sort.id.includes('.')) {
      const parts = sort.id.split('.');
      let obj: Record<string, unknown> = { [parts[parts.length - 1]]: sort.desc ? 'desc' : 'asc' };
      for (let i = parts.length - 2; i >= 0; i--) {
        obj = { [parts[i]]: obj };
      }
      return obj;
    }
    return { [sort.id]: sort.desc ? 'desc' : 'asc' };
  }) || [{ createdAt: 'desc' }]; // Default: mais recentes primeiro

  // 6. Construir INCLUDE (relações)
  const include = validated.includes || {};

  // 7. Executar queries em paralelo
  const [data, totalCount] = await Promise.all([
    model.findMany({
      where,
      orderBy,
      skip: validated.pagination.pageIndex * validated.pagination.pageSize,
      take: validated.pagination.pageSize,
      include: Object.keys(include).length > 0 ? include : undefined,
    }),
    model.count({ where }),
  ]);

  const elapsed = Date.now() - startTime;
  console.log(`[SuperGrid] ${validated.entity}: ${totalCount} registros, página ${validated.pagination.pageIndex}, ${elapsed}ms`);

  return serializeData({
    data: data as Record<string, unknown>[],
    totalCount,
    pageCount: Math.ceil(totalCount / validated.pagination.pageSize),
  });
}

/** Salva (create ou update) um registro genérico */
export async function saveGridRow(
  entity: string,
  data: Record<string, unknown>,
  id?: string
): Promise<Record<string, unknown>> {
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
}

/** Deleta registros em lote com verificação de tenant */
export async function deleteGridRows(
  entity: string,
  ids: string[]
): Promise<{ deleted: number }> {
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
}
