

// src/services/platform-settings.service.ts
/**
 * @fileoverview Este arquivo contém a classe PlatformSettingsService, responsável por
 * gerenciar a lógica de negócio para as configurações globais da plataforma.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma, PlatformSettings as PrismaPlatformSettings } from '@prisma/client';
import type { PlatformSettings } from '@/types';

export class PlatformSettingsService {
    private prisma;

    constructor() {
        this.prisma = prisma;
    }

    /**
     * Obtém as configurações da plataforma para um tenant, incluindo todos os módulos relacionados.
     * Se nenhuma configuração for encontrada, retorna um objeto padrão em memória.
     * @param tenantId O ID do tenant.
     * @returns O objeto de configurações completo.
     */
    async getSettings(tenantId: string): Promise<PlatformSettings> {
        try {
            let settings = await this.prisma.platformSettings.findUnique({
                where: { tenantId: tenantId },
                include: {
                    themes: { include: { colors: true } },
                    platformPublicIdMasks: true,
                    mapSettings: true,
                    biddingSettings: true,
                    paymentGatewaySettings: true,
                    notificationSettings: true,
                    mentalTriggerSettings: true,
                    sectionBadgeVisibility: true,
                    variableIncrementTable: true,
                },
            });

            if (!settings) {
                console.warn(`[PlatformSettingsService] No settings found for tenant ${tenantId}. Returning in-memory default. This is not an error if the setup is not complete.`);
                // Retorna um objeto padrão em memória para evitar crash se o tenant não existir.
                return {
                    tenantId,
                    siteTitle: 'BidExpert',
                    siteTagline: 'Sua plataforma de leilões online.',
                    isSetupComplete: false,
                    themes: [],
                    platformPublicIdMasks: null,
                    mapSettings: null,
                    biddingSettings: null,
                    paymentGatewaySettings: null,
                    notificationSettings: null,
                    mentalTriggerSettings: null,
                    sectionBadgeVisibility: null,
                    variableIncrementTable: [],
                } as unknown as PlatformSettings;
            }

            return {
                ...settings,
                id: settings.id.toString(),
                tenantId: settings.tenantId.toString(),
                isSetupComplete: Boolean(settings.isSetupComplete),
            } as unknown as PlatformSettings;

        } catch (error: any) {
            console.error(`[PlatformSettingsService] Error getting settings for tenant ${tenantId}:`, error);
            throw new Error(`Falha ao carregar configurações: ${error.message}`);
        }
    }
    
    /**
     * Atualiza as configurações da plataforma de forma aninhada.
     * @param data - Os dados parciais das configurações, incluindo sub-objetos.
     * @returns Um objeto indicando o sucesso da operação.
     */
    async updateSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
        const { tenantId, themes, mapSettings, biddingSettings, paymentGatewaySettings, notificationSettings, mentalTriggerSettings, sectionBadgeVisibility, platformPublicIdMasks, variableIncrementTable, ...mainSettings } = data;

        if (!tenantId) {
            return { success: false, message: 'O ID do Tenant é obrigatório para atualizar as configurações.' };
        }
        
        try {
            await this.prisma.platformSettings.update({
                where: { tenantId: tenantId },
                data: {
                    ...mainSettings,
                    ...(mapSettings && { mapSettings: { upsert: { create: mapSettings, update: mapSettings } } }),
                    ...(biddingSettings && { biddingSettings: { upsert: { create: biddingSettings, update: biddingSettings } } }),
                    ...(paymentGatewaySettings && { paymentGatewaySettings: { upsert: { create: paymentGatewaySettings, update: paymentGatewaySettings } } }),
                    ...(notificationSettings && { notificationSettings: { upsert: { create: notificationSettings, update: notificationSettings } } }),
                    ...(mentalTriggerSettings && { mentalTriggerSettings: { upsert: { create: mentalTriggerSettings, update: mentalTriggerSettings } } }),
                    ...(sectionBadgeVisibility && { sectionBadgeVisibility: { upsert: { create: sectionBadgeVisibility as any, update: sectionBadgeVisibility as any } } }),
                    ...(platformPublicIdMasks && { platformPublicIdMasks: { upsert: { create: platformPublicIdMasks as any, update: platformPublicIdMasks as any } } }),
                    ...(variableIncrementTable && {
                        variableIncrementTable: {
                            deleteMany: {}, // Limpa as regras existentes
                            create: variableIncrementTable.map(rule => ({
                                from: rule.from,
                                to: rule.to,
                                increment: rule.increment,
                            }))
                        }
                    })
                },
            });

            return { success: true, message: 'Configurações atualizadas com sucesso.' };
        } catch (error: any) {
            console.error(`[PlatformSettingsService] Error updating settings for tenant ${tenantId}:`, error);
            return { success: false, message: `Falha ao atualizar configurações: ${error.message}` };
        }
    }
}
