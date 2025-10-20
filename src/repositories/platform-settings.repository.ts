// src/repositories/platform-settings.repository.ts
import { prisma } from '@/lib/prisma';
import type { PlatformSettings } from '@/types';
import type { Prisma } from '@prisma/client';

export class PlatformSettingsRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }
  
  async findFirst(): Promise<PlatformSettings | null> {
    const settings = await this.prisma.platformSettings.findFirst({
        include: {
            themes: true,
            platformPublicIdMasks: true,
            mapSettings: true,
            biddingSettings: true,
            // Adicionar includes para outros novos modelos de configuração aqui...
        }
    });
    return settings as PlatformSettings | null;
  }

  async create(data: Prisma.PlatformSettingsCreateInput): Promise<PlatformSettings> {
    const settings = await this.prisma.platformSettings.create({ 
        data,
        include: {
            themes: true,
            mapSettings: true,
            biddingSettings: true,
            platformPublicIdMasks: true,
        }
    });
    return settings as PlatformSettings;
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
