// src/services/platform-settings.service.ts
/**
 * @fileoverview Este arquivo contém a classe PlatformSettingsService, que gerencia
 * as configurações globais da plataforma. Ele é responsável por buscar as
 * configurações do banco de dados ou criar um conjunto padrão caso não existam,
 * além de permitir a sua atualização.
 */
import { PlatformSettingsRepository } from '@/repositories/platform-settings.repository';
import type { PlatformSettings } from '@/types';
import type { Prisma } from '@prisma/client';
import { tenantContext } from '@/lib/tenant-context'; // Importa o contexto do tenant
import { prisma } from '@/lib/prisma'; // Importa a instância direta do prisma


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
            themeSettings: { create: {} },
            mapSettings: { create: {} },
            biddingSettings: { create: {} },
            idMasks: { create: {} },
            paymentGatewaySettings: { create: {} },
            notificationSettings: { create: {} },
            mentalTriggerSettings: { create: {} },
            sectionBadgeVisibility: { create: {} },
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
    return settings as PlatformSettings;
  }
  
  async updateSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
    try {
      const currentSettings = await this.repository.findFirst();

      if (!currentSettings) {
        return { success: false, message: 'Nenhuma configuração encontrada para atualizar.' };
      }
      
      const { tenantId, themeSettings, mapSettings, biddingSettings, idMasks, paymentGatewaySettings, notificationSettings, mentalTriggerSettings, sectionBadgeVisibility, variableIncrementTable, ...restOfData } = data;
      
      await this.prisma.$transaction(async (tx) => {
        await tx.platformSettings.update({
            where: { id: currentSettings.id },
            data: restOfData as any,
        });

        if (themeSettings) {
            await tx.themeSettings.upsert({ 
                where: { platformSettingsId: currentSettings.id },
                update: themeSettings as any,
                create: { ...(themeSettings as any), platformSettingsId: currentSettings.id }
            });
        }
        if (mapSettings) {
            await tx.mapSettings.upsert({ 
                where: { platformSettingsId: currentSettings.id }, 
                update: mapSettings,
                create: { ...mapSettings, platformSettingsId: currentSettings.id } 
            });
        }
        if (biddingSettings) {
            await tx.biddingSettings.upsert({ 
                where: { platformSettingsId: currentSettings.id }, 
                update: biddingSettings,
                create: { ...biddingSettings, platformSettingsId: currentSettings.id } 
            });
        }
        if (idMasks) {
            await tx.idMasks.upsert({ 
                where: { platformSettingsId: currentSettings.id }, 
                update: idMasks,
                create: { ...idMasks, platformSettingsId: currentSettings.id } 
            });
        }
         if (paymentGatewaySettings) {
            await tx.paymentGatewaySettings.upsert({ 
                where: { platformSettingsId: currentSettings.id }, 
                update: paymentGatewaySettings,
                create: { ...paymentGatewaySettings, platformSettingsId: currentSettings.id } 
            });
        }
        if (notificationSettings) {
            await tx.notificationSettings.upsert({ 
                where: { platformSettingsId: currentSettings.id }, 
                update: notificationSettings,
                create: { ...notificationSettings, platformSettingsId: currentSettings.id }
            });
        }
        if (mentalTriggerSettings) {
            await tx.mentalTriggerSettings.upsert({ 
                where: { platformSettingsId: currentSettings.id }, 
                update: mentalTriggerSettings,
                create: { ...mentalTriggerSettings, platformSettingsId: currentSettings.id } 
            });
        }
        if (sectionBadgeVisibility) {
            await tx.sectionBadgeVisibility.upsert({ 
                where: { platformSettingsId: currentSettings.id }, 
                update: sectionBadgeVisibility,
                create: { ...sectionBadgeVisibility, platformSettingsId: currentSettings.id }
            });
        }
         if (variableIncrementTable) {
            await tx.variableIncrementRule.deleteMany({ where: { platformSettingsId: currentSettings.id }});
            await tx.variableIncrementRule.createMany({ 
                data: (variableIncrementTable as any[]).map(rule => ({ ...rule, platformSettingsId: currentSettings.id }))
            });
        }
      });
    
      return { success: true, message: 'Configurações atualizadas com sucesso.' };
    } catch (error: any) {
      console.error(`Error in PlatformSettingsService.updateSettings:`, error);
      return { success: false, message: `Falha ao atualizar configurações: ${error.message}` };
    }
  }
}
