// src/services/platform-settings.service.ts
/**
 * @fileoverview Este arquivo contém a classe PlatformSettingsService, responsável por
 * gerenciar a lógica de negócio para as configurações globais da plataforma.
 */
import { prisma } from '@/lib/prisma';
import { Prisma, type PlatformSettings as PrismaPlatformSettings, type Tenant } from '@prisma/client';
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
    /**
     * Garante que um tenant exista no banco de dados.
     * Se não existir, cria um tenant padrão.
     * @param tenantId O ID do tenant a ser verificado/criado
     * @returns O ID do tenant (como BigInt)
     */
    private async ensureTenantExists(tenantId: bigint): Promise<bigint> {
        try {
            // Tenta encontrar o tenant
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
            });

            // Se o tenant não existir, cria um novo
            if (!tenant) {
                console.warn(`[PlatformSettingsService] Tenant com ID ${tenantId} não encontrado. Criando tenant padrão.`);
                const newTenant = await this.prisma.tenant.create({
                    data: {
                        id: tenantId,
                        name: 'BidExpert Tenant',
                        subdomain: 'default',
                    },
                });
                console.log(`[PlatformSettingsService] Tenant padrão criado com sucesso: ${newTenant.id}`);
            }

            return tenantId;
        } catch (error) {
            console.error('[PlatformSettingsService] Erro ao verificar/criar tenant:', error);
            throw new Error('Falha ao verificar/criar tenant');
        }
    }

    async getSettings(tenantId: string | bigint | number): Promise<PlatformSettings> {
        // Garante que tenantId seja um BigInt para a consulta
        const tenantIdBigInt = BigInt(tenantId);
        
        try {
            // Primeiro, garante que o tenant existe
            await this.ensureTenantExists(tenantIdBigInt);

            const findSettings = async () => {
                return await this.prisma.platformSettings.findUnique({
                    where: { tenantId: tenantIdBigInt },
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
            };

            let settings = await findSettings();

            if (!settings) {
                try {
                    console.warn(`[PlatformSettingsService] No settings found for tenant ${tenantId}. Creating with default values.`);
                    settings = await this.prisma.platformSettings.create({
                        data: {
                            tenantId: tenantIdBigInt,
                            siteTitle: 'BidExpert',
                            siteTagline: 'Sua plataforma de leilões online.',
                            isSetupComplete: false,
                            crudFormMode: 'modal',
                        },
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
                } catch (error: any) {
                    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                        // Unique constraint violation, settings were likely created by a concurrent request.
                        // We can now safely assume the settings exist.
                        console.log(`[PlatformSettingsService] Settings for tenant ${tenantId} created concurrently. Fetching again.`);
                        settings = await findSettings();
                        if (!settings) {
                            // This should theoretically not happen in this race condition scenario
                            throw new Error('Failed to fetch settings after a concurrent creation attempt.');
                        }
                    } else {
                        // Re-throw other errors
                        throw error;
                    }
                }
            }

            return {
                ...settings,
                id: settings.id,
                tenantId: settings.tenantId,
                isSetupComplete: Boolean(settings.isSetupComplete),
            } as unknown as PlatformSettings;

        } catch (error: any) {
            console.error(`[PlatformSettingsService] Error getting settings for tenant ${String(tenantId)}:`, error);
            throw new Error(`Falha ao carregar configurações: ${error.message}`);
        }
    }
    
    /**
     * Atualiza as configurações da plataforma de forma aninhada usando upsert.
     * @param data - Os dados parciais das configurações, incluindo sub-objetos.
     * @returns Um objeto indicando o sucesso da operação.
     */
    async updateSettings(tenantId: string | bigint | number, data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
        // Garante que tenantId seja um BigInt para a consulta
        const tenantIdBigInt = BigInt(tenantId);
        
        // Remove campos que não devem ser atualizados diretamente
        const { 
            tenantId: _, 
            id: __, 
            themes, 
            mapSettings, 
            biddingSettings, 
            paymentGatewaySettings, 
            notificationSettings, 
            mentalTriggerSettings, 
            sectionBadgeVisibility, 
            platformPublicIdMasks, 
            variableIncrementTable, 
            ...mainSettings 
        } = data;

        if (!tenantId) {
            return { success: false, message: 'O ID do Tenant é obrigatório para atualizar as configurações.' };
        }
        
        try {
            const settings = await this.getSettings(tenantId);
            const platformSettingsId = settings.id;

            // Prepara os dados de atualização
            const updateData: any = {
                ...mainSettings
            };

            // Adiciona os relacionamentos apenas se existirem nos dados
            if (mapSettings) {
                updateData.mapSettings = {
                    upsert: {
                        create: { ...mapSettings, id: undefined },
                        update: { ...mapSettings, id: undefined }
                    }
                };
            }

            if (biddingSettings) {
                updateData.biddingSettings = {
                    upsert: {
                        create: { ...biddingSettings, id: undefined },
                        update: { ...biddingSettings, id: undefined }
                    }
                };
            }

            if (paymentGatewaySettings) {
                updateData.paymentGatewaySettings = {
                    upsert: {
                        create: { ...paymentGatewaySettings, id: undefined },
                        update: { ...paymentGatewaySettings, id: undefined }
                    }
                };
            }

            if (notificationSettings) {
                updateData.notificationSettings = {
                    upsert: {
                        create: {
                            notifyOnNewAuction: notificationSettings.notifyOnNewAuction ?? true,
                            notifyOnFeaturedLot: notificationSettings.notifyOnFeaturedLot ?? false,
                            notifyOnAuctionEndingSoon: notificationSettings.notifyOnAuctionEndingSoon ?? true,
                            notifyOnPromotions: notificationSettings.notifyOnPromotions ?? true
                        },
                        update: {
                            notifyOnNewAuction: notificationSettings.notifyOnNewAuction ?? true,
                            notifyOnFeaturedLot: notificationSettings.notifyOnFeaturedLot ?? false,
                            notifyOnAuctionEndingSoon: notificationSettings.notifyOnAuctionEndingSoon ?? true,
                            notifyOnPromotions: notificationSettings.notifyOnPromotions ?? true
                        }
                    }
                };
            }

            if (mentalTriggerSettings) {
                updateData.mentalTriggerSettings = {
                    upsert: {
                        create: {
                            showDiscountBadge: mentalTriggerSettings.showDiscountBadge ?? true,
                            showPopularityBadge: mentalTriggerSettings.showPopularityBadge ?? true,
                            popularityViewThreshold: mentalTriggerSettings.popularityViewThreshold ?? 500,
                            showHotBidBadge: mentalTriggerSettings.showHotBidBadge ?? true,
                            hotBidThreshold: mentalTriggerSettings.hotBidThreshold ?? 10,
                            showExclusiveBadge: mentalTriggerSettings.showExclusiveBadge ?? true
                        },
                        update: {
                            showDiscountBadge: mentalTriggerSettings.showDiscountBadge ?? true,
                            showPopularityBadge: mentalTriggerSettings.showPopularityBadge ?? true,
                            popularityViewThreshold: mentalTriggerSettings.popularityViewThreshold ?? 500,
                            showHotBidBadge: mentalTriggerSettings.showHotBidBadge ?? true,
                            hotBidThreshold: mentalTriggerSettings.hotBidThreshold ?? 10,
                            showExclusiveBadge: mentalTriggerSettings.showExclusiveBadge ?? true
                        }
                    }
                };
            }

            if (sectionBadgeVisibility) {
                updateData.sectionBadgeVisibility = {
                    upsert: {
                        create: {
                            searchGrid: sectionBadgeVisibility.searchGrid ?? {},
                            lotDetail: sectionBadgeVisibility.lotDetail ?? {}
                        },
                        update: {
                            searchGrid: sectionBadgeVisibility.searchGrid ?? {},
                            lotDetail: sectionBadgeVisibility.lotDetail ?? {}
                        }
                    }
                };
            }

            if (platformPublicIdMasks) {
                updateData.platformPublicIdMasks = {
                    upsert: {
                        create: { ...platformPublicIdMasks },
                        update: { ...platformPublicIdMasks }
                    }
                };
            }

            if (variableIncrementTable) {
                updateData.variableIncrementTable = {
                    deleteMany: {}, // Limpa as regras existentes
                    create: variableIncrementTable.map(rule => ({
                        from: rule.from,
                        to: rule.to,
                        increment: rule.increment
                    }))
                };
            }

            try {
                await this.prisma.platformSettings.update({
                    where: { tenantId: tenantIdBigInt },
                    data: updateData
                });

                return { success: true, message: 'Configurações atualizadas com sucesso.' };
            } catch (error: any) {
                console.error(`[PlatformSettingsService] Error updating settings for tenant ${String(tenantId)}:`, error);
                return { success: false, message: `Falha ao atualizar configurações: ${error.message}` };
            }
        } catch (error: any) {
            console.error(`[PlatformSettingsService] Unexpected error in updateSettings for tenant ${String(tenantId)}:`, error);
            return { success: false, message: `Erro inesperado ao atualizar configurações: ${error.message}` };
        }
    }
}
