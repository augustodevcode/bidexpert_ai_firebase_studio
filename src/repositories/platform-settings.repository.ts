// src/repositories/platform-settings.repository.ts
import { prisma } from '@/lib/prisma';
import type { PlatformSettings } from '@/types';
import type { Prisma } from '@prisma/client';

export class PlatformSettingsRepository {
  async findFirst(): Promise<PlatformSettings | null> {
    return prisma.platformSettings.findFirst();
  }

  async findById(id: string): Promise<PlatformSettings | null> {
    return prisma.platformSettings.findUnique({ where: { id } });
  }

  async create(data: Prisma.PlatformSettingsCreateInput): Promise<PlatformSettings> {
    // @ts-ignore
    return prisma.platformSettings.create({ data });
  }

  async update(id: string, data: Prisma.PlatformSettingsUpdateInput): Promise<PlatformSettings> {
    // @ts-ignore
    return prisma.platformSettings.update({ where: { id }, data });
  }
}
