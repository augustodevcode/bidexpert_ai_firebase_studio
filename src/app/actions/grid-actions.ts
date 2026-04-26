/**
 * @fileoverview Server Actions genéricos do SuperGrid.
 * Implementa CRUD completo com paginação server-side, ordenação, filtros,
 * busca global, agregações e isolamento multi-tenant via getTenantIdFromRequest.
 * Suporta qualquer entidade Prisma via configuração parametrizada.
 */
'use server';

import { getGridDataService } from '@/server/services/grid-data.service';
import { sanitizeResponse } from '@/lib/serialization-helper';

function serializeData<T>(data: T): T {
  return sanitizeResponse(data);
}

/** Resolve o modelo Prisma dinamicamente a partir do nome da entidade */
// (Removed getPrismaModel as it is now in the service)

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

  try {
    return await getGridDataService(validated, tenantId);
  } catch (error) {
    console.error(`[fetchGridData] Erro ao buscar dados da entidade ${validated.entity}:`, error);
    throw error;
  }
}
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
  } catch (error) {
    console.error(`[SuperGrid] Error fetching ${validated.entity}:`, error);
    return serializeData({
      data: [] as Record<string, unknown>[],
      totalCount: 0,
      pageCount: 0,
    });
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
