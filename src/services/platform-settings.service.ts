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

export class PlatformSettingsService {
  private repository: PlatformSettingsRepository;

  constructor() {
    this.repository = new PlatformSettingsRepository();
  }

  async getSettings(): Promise<PlatformSettings | null> {
    const settings = await this.repository.findFirst();
    if (!settings) {
      console.log("[PlatformSettingsService] No settings found, creating default settings for Landlord Tenant...");
      const defaultSettingsData = {
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
      };
      
      // @ts-ignore - The repository expects Prisma.PlatformSettingsCreateInput which requires the tenant relation.
      return this.repository.create({
        ...defaultSettingsData,
        tenant: {
            connectOrCreate: {
                where: { id: '1' },
                create: { id: '1', name: 'Landlord', subdomain: 'www' }
            }
        }
      });
    }
    return settings;
  }
  
  async updateSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
    try {
      const currentSettings = await this.repository.findFirst();
      if (!currentSettings) {
        return { success: false, message: 'Nenhuma configuração encontrada para atualizar.' };
      }
      // O ID do tenant não pode ser atualizado por aqui.
      const { tenantId, ...updateData } = data;
      await this.repository.update(currentSettings.id, updateData);
      return { success: true, message: 'Configurações atualizadas com sucesso.' };
    } catch (error: any) {
      console.error(`Error in PlatformSettingsService.updateSettings:`, error);
      return { success: false, message: `Falha ao atualizar configurações: ${error.message}` };
    }
  }
}
