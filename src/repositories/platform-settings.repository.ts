// src/repositories/platform-settings.repository.ts
import { prisma } from '@/lib/prisma';
import type { PlatformSettings } from '@/types';
import type { Prisma } from '@prisma/client';

export class PlatformSettingsRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }
  
  async findFirst(): Promise<any | null> {
    const settings = await this.prisma.platformSettings.findFirst({});
    return settings;
  }

  async create(data: Prisma.PlatformSettingsCreateInput): Promise<PlatformSettings> {
    const settings = await this.prisma.platformSettings.create({ 
        data,
    });
    return settings as unknown as PlatformSettings;
  }

  async update(id: string, data: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const { id: _, tenantId, ...updateData } = data;

    const dataToUpdate: Partial<Prisma.PlatformSettingsUpdateInput> = { ...updateData };
        
    const updatedSettings = await this.prisma.platformSettings.update({
        where: { id },
        data: dataToUpdate as any,
    });
    
    return updatedSettings as unknown as PlatformSettings;
  }
}
