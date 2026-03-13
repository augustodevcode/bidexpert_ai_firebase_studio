/**
 * @fileoverview Server Actions para CRUD de DataSources no Admin Plus.
 */
'use server';

import { z } from 'zod';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { DataSourceService } from '@/services/data-source.service';
import { createDataSourceSchema, updateDataSourceSchema } from './schema';

const dataSourceService = new DataSourceService();

type DSRow = { id: string; name: string; modelName: string; fields: string };

function serializeDS(row: { id: bigint; name: string; modelName: string; fields: unknown }): DSRow {
  return { id: String(row.id), name: row.name, modelName: row.modelName, fields: JSON.stringify(row.fields) };
}

export const listDataSourcesAction = createAdminAction({
  requiredPermission: 'data-sources:read',
  handler: async () => {
    const rows = await dataSourceService.getDataSources();
    const data = rows.map(serializeDS);
    return { data, total: data.length, page: 1, pageSize: data.length || 25, totalPages: 1 };
  },
});

export const getDataSourceByIdAction = createAdminAction({
  requiredPermission: 'data-sources:read',
  inputSchema: z.object({ id: z.string() }),
  handler: async ({ input }) => {
    const row = await dataSourceService.getDataSourceById(input.id);
    if (!row) throw new Error('DataSource não encontrada');
    return serializeDS(row);
  },
});

export const createDataSourceAction = createAdminAction({
  requiredPermission: 'data-sources:create',
  inputSchema: createDataSourceSchema,
  handler: async ({ input }) => {
    const result = await dataSourceService.upsertDataSource({
      name: input.name,
      modelName: input.modelName,
      fields: JSON.parse(input.fields),
    } as Parameters<typeof dataSourceService.upsertDataSource>[0]);
    if (!result.success) throw new Error(result.message);
    return { id: result.dataSource ? String(result.dataSource.id) : '' };
  },
});

export const updateDataSourceAction = createAdminAction({
  requiredPermission: 'data-sources:update',
  inputSchema: z.object({ id: z.string(), data: updateDataSourceSchema }),
  handler: async ({ input }) => {
    const payload: Record<string, unknown> = {};
    if (input.data.name !== undefined) payload.name = input.data.name;
    if (input.data.modelName !== undefined) payload.modelName = input.data.modelName;
    if (input.data.fields !== undefined) payload.fields = JSON.parse(input.data.fields);
    const result = await dataSourceService.updateDataSource(input.id, payload as Parameters<typeof dataSourceService.updateDataSource>[1]);
    if (!result.success) throw new Error(result.message);
  },
});

export const deleteDataSourceAction = createAdminAction({
  requiredPermission: 'data-sources:delete',
  inputSchema: z.object({ id: z.string() }),
  handler: async ({ input }) => {
    const result = await dataSourceService.deleteDataSource(input.id);
    if (!result.success) throw new Error(result.message);
  },
});
