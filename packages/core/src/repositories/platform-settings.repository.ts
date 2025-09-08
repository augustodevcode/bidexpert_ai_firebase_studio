// packages/core/src/repositories/platform-settings.repository.ts
import { prisma } from '../lib/prisma';
import type { PlatformSettings } from '@bidexpert/core';
import type { Prisma } from '@prisma/client';

export class PlatformSettingsRepository {
  async findFirst(): Promise<PlatformSettings | null> {
    console.log('[REPOSITORY - findFirst] Fetching first platform settings record.');
    // @ts-ignore
    return prisma.platformSettings.findFirst();
  }

  async findById(id: string): Promise<PlatformSettings | null> {
    console.log(`[REPOSITORY - findById] Fetching platform settings record with id: ${id}`);
    // @ts-ignore
    return prisma.platformSettings.findUnique({ where: { id } });
  }

  async create(data: Prisma.PlatformSettingsCreateInput): Promise<PlatformSettings> {
    console.log('[REPOSITORY - create] Creating new platform settings record.');
    // @ts-ignore
    return prisma.platformSettings.create({ data });
  }

  async update(id: string, data: Prisma.PlatformSettingsUpdateInput): Promise<PlatformSettings> {
    console.log(`[REPOSITORY - update] Updating platform settings record with id: ${id}. Data dump:`, JSON.stringify(data, null, 2));
    // @ts-ignore
    return prisma.platformSettings.update({ where: { id }, data });
  }
}
