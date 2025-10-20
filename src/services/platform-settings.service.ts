// src/services/platform-settings.service.ts
/**
 * @fileoverview Este arquivo contém a classe PlatformSettingsService, que gerencia
 * as configurações globais da plataforma. Ele é responsável por buscar as
 * configurações do banco de dados ou criar um conjunto padrão caso não existam,
 * além de permitir a sua atualização.
 */
import { PlatformSettingsRepository } from '@/repositories/platform-settings.repository';
import type { PlatformSettings, ThemeSettings, MapSettings, BiddingSettings, IdMasks, PaymentGatewaySettings, NotificationSettings } from '@/types';
import type { Prisma } from '@prisma/client';
import { tenantContext } from '@/lib/tenant-context'; // Importa o contexto do tenant

export class PlatformSettingsService {
  private repository: PlatformSettingsRepository;
  private prisma;

  constructor() {
    this.repository = new PlatformSettingsRepository();
    this.prisma = prisma;
  }
  
  private async createDefaultSettings(tenantId: string): Promise<PlatformSettings> {
    const defaultData: Omit<Prisma.PlatformSettingsCreateInput, 'tenant'> = {
        isSetupComplete: false,
        siteTitle: 'BidExpert',
        siteTagline: 'Sua plataforma de leilões online.',
        logoUrl: null,
        crudFormMode: 'modal',
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
    };

    const newSettings = await this.prisma.platformSettings.create({
        data: {
            ...defaultData,
            tenant: { connect: { id: tenantId } },
            themes: { create: {} },
            mapSettings: { create: {} },
            biddingSettings: { create: {} },
            platformPublicIdMasks: { create: {} },
        }
    });

    return (await this.repository.findFirst())!;
  }


  async getSettings(): Promise<PlatformSettings | null> {
    const settings = await this.repository.findFirst();
    if (!settings) {
      console.log("[PlatformSettingsService] No settings found, creating default settings for Landlord Tenant...");
      // A criação de settings é sempre para o tenant '1' se não existir
      return this.createDefaultSettings('1');
    }
    return settings;
  }
  
  async updateSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
    try {
      const currentSettings = await this.repository.findFirst();

      if (!currentSettings) {
        return { success: false, message: 'Nenhuma configuração encontrada para atualizar.' };
      }
      
      const { tenantId, themes, mapSettings, biddingSettings, platformPublicIdMasks, ...restOfData } = data;
      
      await this.prisma.$transaction(async (tx) => {
        await tx.platformSettings.update({
            where: { id: currentSettings.id },
            data: restOfData as any,
        });

        if (themes) {
            await tx.themeSettings.update({ where: { platformSettingsId: currentSettings.id }, data: themes });
        }
        if (mapSettings) {
            await tx.mapSettings.update({ where: { platformSettingsId: currentSettings.id }, data: mapSettings });
        }
        if (biddingSettings) {
            await tx.biddingSettings.update({ where: { platformSettingsId: currentSettings.id }, data: biddingSettings });
        }
        if (platformPublicIdMasks) {
            await tx.idMasks.update({ where: { platformSettingsId: currentSettings.id }, data: platformPublicIdMasks });
        }
      });
    
      return { success: true, message: 'Configurações atualizadas com sucesso.' };
    } catch (error: any) {
      console.error(`Error in PlatformSettingsService.updateSettings:`, error);
      return { success: false, message: `Falha ao atualizar configurações: ${error.message}` };
    }
  }
}
