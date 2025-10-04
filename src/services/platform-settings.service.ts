// src/services/platform-settings.service.ts
/**
 * @fileoverview Este arquivo contém a classe PlatformSettingsService, que gerencia
 * as configurações globais da plataforma. Ele é responsável por buscar as
 * configurações do banco de dados ou criar um conjunto padrão caso não existam,
 * além de permitir a sua atualização.
 */
import { PlatformSettingsRepository } from '@/repositories/platform-settings.repository';
import type { PlatformSettings, NotificationSettings } from '@/types';
import type { Prisma } from '@prisma/client';
import { tenantContext } from '@/lib/tenant-context'; // Importa o contexto do tenant

export class PlatformSettingsService {
  private repository: PlatformSettingsRepository;

  constructor() {
    this.repository = new PlatformSettingsRepository();
  }

  async getSettings(): Promise<PlatformSettings | null> {
    const settings = await this.repository.findFirst();
    if (!settings) {
      console.log("[PlatformSettingsService] No settings found, creating default settings for Landlord Tenant...");
      // Garante que a criação seja feita no contexto do tenant '1'
      return tenantContext.run({ tenantId: '1' }, async () => {
        const defaultSettingsData = {
            isSetupComplete: false,
            siteTitle: 'BidExpert',
            siteTagline: 'Sua plataforma de leilões online.',
            galleryImageBasePath: '/uploads/media/',
            storageProvider: 'local',
            searchPaginationType: 'loadMore',
            searchItemsPerPage: 12,
            searchLoadMoreCount: 12,
            showCountdownOnLotDetail: true,
            showCountdownOnCards: true,
            showRelatedLotsOnLotDetail: true,
            relatedLotsCount: 4,
            defaultListItemsPerPage: 10,
            homepageSections: [],
            notificationSettings: {
                notifyOnNewAuction: true,
                notifyOnFeaturedLot: true,
                notifyOnAuctionEndingSoon: true,
                notifyOnPromotions: true,
            } as Prisma.JsonObject
        };
        // O repositório já deve usar o getPrismaInstance() que respeita o contexto
        return this.repository.create(defaultSettingsData as any);
      });
    }
    return settings;
  }
  
  async updateSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
    try {
      // As configurações são globais, mas a busca inicial pode precisar de um contexto.
      const currentSettings = await this.repository.findFirst();

      if (!currentSettings) {
        return { success: false, message: 'Nenhuma configuração encontrada para atualizar.' };
      }
      
      const { tenantId, ...updateData } = data;
      
      const dataToUpdate: Partial<Prisma.PlatformSettingsUpdateInput> = {};
      
      const jsonFields: (keyof PlatformSettings)[] = [
        'themes', 'platformPublicIdMasks', 'mapSettings', 'variableIncrementTable', 
        'biddingSettings', 'paymentGatewaySettings', 'notificationSettings', 'homepageSections', 
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
        
    const updatedSettings = await this.repository.update(currentSettings.id, dataToUpdate as any);
    
    return { success: true, message: 'Configurações atualizadas com sucesso.' };
    } catch (error: any) {
      console.error(`Error in PlatformSettingsService.updateSettings:`, error);
      return { success: false, message: `Falha ao atualizar configurações: ${error.message}` };
    }
  }
}
