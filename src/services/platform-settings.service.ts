// src/services/platform-settings.service.ts
/**
 * @fileoverview Lógica de negócio para as configurações da plataforma.
 * Garante que as configurações existam para um tenant, criando um conjunto
 * padrão se necessário, o que é crucial para a inicialização da aplicação e o fluxo de setup.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma, PlatformSettings } from '@prisma/client';

export class PlatformSettingsService {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Obtém as configurações para um tenant específico. Se não existirem,
   * cria e retorna um conjunto de configurações padrão para esse tenant.
   * @param tenantId O ID do tenant para buscar as configurações.
   * @returns As configurações da plataforma para o tenant.
   */
  async getSettings(tenantId: string = '1'): Promise<PlatformSettings> {
    const settings = await this.prisma.platformSettings.findUnique({
      where: { tenantId },
      include: {
        themes: true,
        platformPublicIdMasks: true,
        mapSettings: true,
        biddingSettings: true,
        mentalTriggerSettings: true,
        sectionBadgeVisibility: true,
        variableIncrementTable: true,
        paymentGatewaySettings: true,
        notificationSettings: true,
      }
    });

    if (!settings) {
      console.log(`[PlatformSettingsService] No settings found for tenant ${tenantId}. Creating default settings.`);
      // Se não encontrar, cria um registro padrão para esse tenant
      return this.prisma.platformSettings.create({
        data: {
          tenant: { connect: { id: tenantId } },
          siteTitle: 'BidExpert',
          isSetupComplete: false, // Fundamental para o fluxo de setup
        },
        include: {
            themes: true,
            platformPublicIdMasks: true,
            mapSettings: true,
            biddingSettings: true,
            mentalTriggerSettings: true,
            sectionBadgeVisibility: true,
            variableIncrementTable: true,
            paymentGatewaySettings: true,
            notificationSettings: true,
        }
      });
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
