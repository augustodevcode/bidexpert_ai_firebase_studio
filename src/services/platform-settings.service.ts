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
     * Se nenhuma configuração for encontrada, cria uma com valores padrão.
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
                console.warn(`[PlatformSettingsService] No settings found for tenant ${tenantId}. Creating with default values.`);
                settings = await this.prisma.platformSettings.create({
                    data: {
                        tenantId: tenantId,
                        siteTitle: 'BidExpert',
                        siteTagline: 'Sua plataforma de leilões online.',
                        isSetupComplete: false,
                        crudFormMode: 'modal',
                    }
                });
            }

            return {
                ...settings,
                id: settings.id,
                tenantId: settings.tenantId,
                isSetupComplete: Boolean(settings.isSetupComplete),
            } as unknown as PlatformSettings;

        } catch (error: any) {
            console.error(`[PlatformSettingsService] Error getting settings for tenant ${tenantId}:`, error);
            throw new Error(`Falha ao carregar configurações: ${error.message}`);
        }
    }
    
    /**
     * Atualiza as configurações da plataforma de forma aninhada usando upsert.
     * @param data - Os dados parciais das configurações, incluindo sub-objetos.
     * @returns Um objeto indicando o sucesso da operação.
     */
    async updateSettings(tenantId: string, data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
        const { themes, mapSettings, biddingSettings, paymentGatewaySettings, notificationSettings, mentalTriggerSettings, sectionBadgeVisibility, platformPublicIdMasks, variableIncrementTable, ...mainSettings } = data;

        if (!tenantId) {
            return { success: false, message: 'O ID do Tenant é obrigatório para atualizar as configurações.' };
        }
        
        try {
            const settings = await this.getSettings(tenantId);
            const platformSettingsId = settings.id;

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
