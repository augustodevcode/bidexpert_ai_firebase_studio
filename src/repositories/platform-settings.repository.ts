
// src/repositories/platform-settings.repository.ts
import { prisma, getPrismaInstance } from '@/lib/prisma';
import type { PlatformSettings } from '@/types';
import type { Prisma } from '@prisma/client';

export class PlatformSettingsRepository {
  private prisma;

  constructor() {
    // Usamos o prisma base, pois as configurações são globais e não por tenant.
    this.prisma = prisma;
  }
  
  async findFirst(): Promise<PlatformSettings | null> {
    const settings = await this.prisma.platformSettings.findFirst();
    return settings as PlatformSettings | null;
  }

  async create(data: Prisma.PlatformSettingsCreateInput): Promise<PlatformSettings> {
    const settings = await this.prisma.platformSettings.create({ data });
    return settings as PlatformSettings;
  }

  async update(id: string, data: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const { id: _, tenantId, ...updateData } = data;

     const dataToUpdate: Partial<Prisma.PlatformSettingsUpdateInput> = {};
      
      const jsonFields: (keyof PlatformSettings)[] = [
        'themes', 'platformPublicIdMasks', 'mapSettings', 'variableIncrementTable', 
        'biddingSettings', 'paymentGatewaySettings', 'homepageSections', 
        'mentalTriggerSettings', 'sectionBadgeVisibility'
      ];

      for (const key in updateData) {
        if (Object.prototype.hasOwnProperty.call(updateData, key)) {
          const typedKey = key as keyof PlatformSettings;
          if (jsonFields.includes(typedKey)) {
            // @ts-ignore
            dataToUpdate[key] = updateData[typedKey] || Prisma.JsonNull;
          } else {
            // @ts-ignore
            dataToUpdate[key] = updateData[typedKey];
          }
        }
      }
        
    const updatedSettings = await this.prisma.platformSettings.update({
        where: { id },
        data: dataToUpdate as any,
    });
    
    return updatedSettings as unknown as PlatformSettings;
  }
}
