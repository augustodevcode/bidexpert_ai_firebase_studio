// src/services/platform-settings.service.ts
/**
 * @fileoverview Este arquivo contém a classe PlatformSettingsService, responsável por
 * gerenciar a lógica de negócio para as configurações globais da plataforma.
 */
import { withAudit } from '@/lib/audit'; // Importa a função de auditoria
import { Prisma, type PlatformSettings as PrismaPlatformSettings, type Tenant } from '@prisma/client';
import type { PlatformSettings } from '@/types';
import { prisma } from '@/lib/prisma';

type TenantCacheKey = string;

export class PlatformSettingsService {
    private static ensuredTenants = new Set<TenantCacheKey>();
    private static ensureTenantPromises = new Map<TenantCacheKey, Promise<bigint>>();
    private static settingsCache = new Map<TenantCacheKey, PlatformSettings>();
    private static settingsPromises = new Map<TenantCacheKey, Promise<PlatformSettings>>();

    /**
     * Garante que um tenant exista no banco de dados.
     * Se não existir, cria um tenant padrão.
     * @param tenantId O ID do tenant a ser verificado/criado
     * @returns O ID do tenant (como BigInt)
     */
    private async ensureTenantExists(tenantId: bigint): Promise<bigint> {
        const cacheKey = tenantId.toString();

        if (PlatformSettingsService.ensuredTenants.has(cacheKey)) {
            return tenantId;
        }

        const pending = PlatformSettingsService.ensureTenantPromises.get(cacheKey);
        if (pending) {
            return pending;
        }

        const ensurePromise = (async () => {
            try {
                const tenant = await prisma.tenant.findUnique({
                    where: { id: tenantId },
                });

                if (!tenant) {
                    console.warn(`[PlatformSettingsService] Tenant com ID ${tenantId} não encontrado. Criando tenant padrão.`);
                    const newTenant = await prisma.tenant.create({
                        data: {
                            id: tenantId,
                            name: 'BidExpert Tenant',
                            subdomain: 'default',
                        },
                    });
                    console.log(`[PlatformSettingsService] Tenant padrão criado com sucesso: ${newTenant.id}`);
                }

                PlatformSettingsService.ensuredTenants.add(cacheKey);
                return tenantId;
            } catch (error) {
                console.error('[PlatformSettingsService] Erro ao verificar/criar tenant:', error);
                throw new Error('Falha ao verificar/criar tenant');
            } finally {
                PlatformSettingsService.ensureTenantPromises.delete(cacheKey);
            }
        })();

        PlatformSettingsService.ensureTenantPromises.set(cacheKey, ensurePromise);
        return ensurePromise;
    }

    private async loadSettingsFromDatabase(tenantId: bigint): Promise<PlatformSettings> {
        const findSettings = async () => {
            return await prisma.platformSettings.findUnique({
                where: { tenantId },
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

                const createData = {
                    tenantId,
                    siteTitle: 'BidExpert',
                    siteTagline: 'Sua plataforma de leilões online.',
                    isSetupComplete: false,
                    crudFormMode: 'modal',
                };

                settings = await withAudit({
                    model: 'PlatformSettings',
                    action: 'create',
                    prismaAction: prisma.platformSettings.create({
                        data: createData,
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
                    }),
                    data: createData,
                });

            } catch (error: any) {
                if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                    console.log(`[PlatformSettingsService] Settings for tenant ${tenantId} created concurrently. Fetching again.`);
                    settings = await findSettings();
                    if (!settings) {
                        throw new Error('Failed to fetch settings after a concurrent creation attempt.');
                    }
                } else {
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
    }

    async getSettings(tenantId: string | bigint | number): Promise<PlatformSettings> {
        const tenantIdBigInt = BigInt(tenantId);
        const cacheKey = tenantIdBigInt.toString();

        try {
            await this.ensureTenantExists(tenantIdBigInt);

            const cached = PlatformSettingsService.settingsCache.get(cacheKey);
            if (cached) {
                return cached;
            }

            const pending = PlatformSettingsService.settingsPromises.get(cacheKey);
            if (pending) {
                return pending;
            }

            const loadPromise = this.loadSettingsFromDatabase(tenantIdBigInt)
                .then((loaded) => {
                    PlatformSettingsService.settingsCache.set(cacheKey, loaded);
                    return loaded;
                })
                .catch((error) => {
                    PlatformSettingsService.settingsCache.delete(cacheKey);
                    throw error;
                })
                .finally(() => {
                    PlatformSettingsService.settingsPromises.delete(cacheKey);
                });

            PlatformSettingsService.settingsPromises.set(cacheKey, loadPromise);
            return loadPromise;
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
                const cacheKey = tenantIdBigInt.toString();
                // Ação de atualização agora envolvida pela função de auditoria
                await withAudit({
                    model: 'PlatformSettings',
                    action: 'update',
                    prismaAction: prisma.platformSettings.update({
                        where: { tenantId: tenantIdBigInt },
                        data: updateData
                    }),
                    where: { tenantId: tenantIdBigInt },
                    data: updateData
                });

                PlatformSettingsService.settingsCache.delete(cacheKey);

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
