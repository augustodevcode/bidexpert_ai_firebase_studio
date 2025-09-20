// src/app/admin/datasources/actions.ts
'use server';

import { DataSourceService } from '@/services/data-source.service';
import type { DataSource } from '@prisma/client';

const service = new DataSourceService();

export async function getDataSourcesAction(): Promise<DataSource[]> {
  return service.getDataSources();
}
