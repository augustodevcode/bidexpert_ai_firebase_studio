// src/services/platform-settings.service.ts
/**
 * @fileoverview Lógica de negócio para as configurações da plataforma.
 * Garante que as configurações existam para um tenant, criando um conjunto
 * padrão se necessário, o que é crucial para a inicialização da aplicação e o fluxo de setup.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma, PlatformSettings } from '@prisma/client';
import { PlatformSettingsRepository } from '../repositories/platform-settings.repository';

export class PlatformSettingsService {
  private repository: PlatformSettingsRepository;
  private prisma;

  constructor() {
    this.repository = new PlatformSettingsRepository();
    this.prisma = prisma;
  }

  /**
   * Obtém as configurações para um tenant específico. Se não existirem,
   * cria e retorna um conjunto de configurações padrão.
   * @param {bigint} tenantId - O ID do tenant.
   * @returns {Promise<PlatformSettings>} As configurações da plataforma.
   */
  async getSettings(tenantId: bigint): Promise<PlatformSettings> {
    const settings = await this.repository.findByTenantId(tenantId);
    
    if (!settings) {
      console.warn(`[PlatformSettingsService] No settings found for tenant ${tenantId}. Creating default settings.`);
      const defaultSettings = await this.repository.create(tenantId, {
          isSetupComplete: false,
          siteTitle: 'BidExpert',
          siteTagline: 'Sua plataforma de leilões online.',
          crudFormMode: 'modal',
          // Adicione outros valores padrão conforme necessário
      });
      return defaultSettings;
    }
    
    return settings;
  }

  /**
   * Atualiza as configurações de um tenant específico.
   * @param data Os dados parciais das configurações a serem atualizados.
   * @returns O resultado da operação.
   */
  async updateSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string }> {
      const tenantId = data.tenantId;
      if (!tenantId) {
          return { success: false, message: "Tenant ID é obrigatório para atualizar as configurações." };
      }
      try {
        await this.prisma.platformSettings.update({
            where: { tenantId: tenantId },
            data: data as Prisma.PlatformSettingsUpdateInput,
        });
        return { success: true, message: "Configurações atualizadas com sucesso." };
      } catch (error: any) {
          console.error("Error updating platform settings:", error);
          return { success: false, message: `Falha ao atualizar configurações: ${error.message}`};
      }
  }
}
