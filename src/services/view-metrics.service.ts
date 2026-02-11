/**
 * @file view-metrics.service.ts
 * @description Serviço para gerenciamento de métricas de visualização (pageviews) de entidades.
 * Permite registrar, consultar e incrementar contadores de views para lotes, leilões, etc.
 * 
 * BDD Scenarios:
 * - Dado que um usuário acessa a página de um lote
 * - Quando a página é carregada completamente
 * - Então o contador de visualizações deve ser incrementado
 * - E a data da última visualização deve ser atualizada
 */
'use server';

import prisma from '@/lib/prisma';
import { getCurrentTenant } from '@/lib/tenant';
import type { entity_view_metrics } from '@prisma/client';

export type EntityType = 'Lot' | 'Auction' | 'Asset' | 'Article';

export interface ViewMetricsData {
  totalViews: number;
  uniqueViews: number;
  viewsLast24h: number;
  viewsLast7d: number;
  viewsLast30d: number;
  sharesCount: number;
  favoritesCount: number;
  lastViewedAt: Date | null;
}

/**
 * Registra uma visualização para uma entidade específica
 * @param entityType - Tipo da entidade (Lot, Auction, Asset, Article)
 * @param entityId - ID da entidade
 * @param isUnique - Se é uma view única (novo usuário/sessão)
 */
export async function recordEntityView(
  entityType: EntityType,
  entityId: bigint | string,
  isUnique: boolean = false
): Promise<{ success: boolean; message: string }> {
  try {
    const tenant = await getCurrentTenant();
    const entityIdBigInt = typeof entityId === 'string' ? BigInt(entityId) : entityId;
    
    // Upsert: criar ou atualizar métricas
    await prisma.entity_view_metrics.upsert({
      where: {
        entityType_entityId: {
          entityType,
          entityId: entityIdBigInt
        }
      },
      update: {
        totalViews: { increment: 1 },
        uniqueViews: isUnique ? { increment: 1 } : undefined,
        viewsLast24h: { increment: 1 },
        viewsLast7d: { increment: 1 },
        viewsLast30d: { increment: 1 },
        lastViewedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        entityType,
        entityId: entityIdBigInt,
        tenantId: tenant?.tenantId ? BigInt(tenant.tenantId) : null,
        totalViews: 1,
        uniqueViews: isUnique ? 1 : 0,
        viewsLast24h: 1,
        viewsLast7d: 1,
        viewsLast30d: 1,
        lastViewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return { success: true, message: 'View registrada com sucesso' };
  } catch (error) {
    console.error('[ViewMetricsService] Erro ao registrar view:', error);
    return { success: false, message: 'Erro ao registrar visualização' };
  }
}

/**
 * Obtém métricas de visualização para uma entidade
 * @param entityType - Tipo da entidade
 * @param entityId - ID da entidade
 */
export async function getEntityViewMetrics(
  entityType: EntityType,
  entityId: bigint | string
): Promise<ViewMetricsData | null> {
  try {
    const entityIdBigInt = typeof entityId === 'string' ? BigInt(entityId) : entityId;
    
    const metrics = await prisma.entity_view_metrics.findUnique({
      where: {
        entityType_entityId: {
          entityType,
          entityId: entityIdBigInt
        }
      }
    });

    if (!metrics) return null;

    return {
      totalViews: metrics.totalViews,
      uniqueViews: metrics.uniqueViews,
      viewsLast24h: metrics.viewsLast24h,
      viewsLast7d: metrics.viewsLast7d,
      viewsLast30d: metrics.viewsLast30d,
      sharesCount: metrics.sharesCount,
      favoritesCount: metrics.favoritesCount,
      lastViewedAt: metrics.lastViewedAt
    };
  } catch (error) {
    console.error('[ViewMetricsService] Erro ao obter métricas:', error);
    return null;
  }
}

/**
 * Obtém métricas de visualização para múltiplas entidades
 * @param entityType - Tipo da entidade
 * @param entityIds - IDs das entidades
 */
export async function getEntitiesViewMetrics(
  entityType: EntityType,
  entityIds: (bigint | string)[]
): Promise<Map<string, ViewMetricsData>> {
  try {
    const entityIdsBigInt = entityIds.map(id => 
      typeof id === 'string' ? BigInt(id) : id
    );

    const metrics = await prisma.entity_view_metrics.findMany({
      where: {
        entityType,
        entityId: { in: entityIdsBigInt }
      }
    });

    const metricsMap = new Map<string, ViewMetricsData>();
    
    for (const m of metrics) {
      metricsMap.set(m.entityId.toString(), {
        totalViews: m.totalViews,
        uniqueViews: m.uniqueViews,
        viewsLast24h: m.viewsLast24h,
        viewsLast7d: m.viewsLast7d,
        viewsLast30d: m.viewsLast30d,
        sharesCount: m.sharesCount,
        favoritesCount: m.favoritesCount,
        lastViewedAt: m.lastViewedAt
      });
    }

    return metricsMap;
  } catch (error) {
    console.error('[ViewMetricsService] Erro ao obter métricas em batch:', error);
    return new Map();
  }
}

/**
 * Incrementa contador de compartilhamentos
 */
export async function recordEntityShare(
  entityType: EntityType,
  entityId: bigint | string
): Promise<{ success: boolean }> {
  try {
    const entityIdBigInt = typeof entityId === 'string' ? BigInt(entityId) : entityId;
    
    await prisma.entity_view_metrics.upsert({
      where: {
        entityType_entityId: {
          entityType,
          entityId: entityIdBigInt
        }
      },
      update: {
        sharesCount: { increment: 1 },
        updatedAt: new Date()
      },
      create: {
        entityType,
        entityId: entityIdBigInt,
        sharesCount: 1,
        totalViews: 0,
        uniqueViews: 0,
        viewsLast24h: 0,
        viewsLast7d: 0,
        viewsLast30d: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return { success: true };
  } catch (error) {
    console.error('[ViewMetricsService] Erro ao registrar share:', error);
    return { success: false };
  }
}

/**
 * Incrementa contador de favoritos
 */
export async function recordEntityFavorite(
  entityType: EntityType,
  entityId: bigint | string,
  increment: boolean = true
): Promise<{ success: boolean }> {
  try {
    const entityIdBigInt = typeof entityId === 'string' ? BigInt(entityId) : entityId;
    
    await prisma.entity_view_metrics.upsert({
      where: {
        entityType_entityId: {
          entityType,
          entityId: entityIdBigInt
        }
      },
      update: {
        favoritesCount: increment ? { increment: 1 } : { decrement: 1 },
        updatedAt: new Date()
      },
      create: {
        entityType,
        entityId: entityIdBigInt,
        favoritesCount: increment ? 1 : 0,
        totalViews: 0,
        uniqueViews: 0,
        viewsLast24h: 0,
        viewsLast7d: 0,
        viewsLast30d: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return { success: true };
  } catch (error) {
    console.error('[ViewMetricsService] Erro ao registrar favorito:', error);
    return { success: false };
  }
}

/**
 * Obtém os Top N lotes mais visualizados
 */
export async function getTopViewedLots(
  limit: number = 10,
  period: '24h' | '7d' | '30d' | 'all' = '7d'
): Promise<{ entityId: string; views: number }[]> {
  try {
    const tenant = await getCurrentTenant();
    
    const orderByField = period === '24h' ? 'viewsLast24h'
      : period === '7d' ? 'viewsLast7d'
      : period === '30d' ? 'viewsLast30d'
      : 'totalViews';

    const metrics = await prisma.entity_view_metrics.findMany({
      where: {
        entityType: 'Lot',
        tenantId: tenant?.tenantId ? BigInt(tenant.tenantId) : undefined
      },
      orderBy: {
        [orderByField]: 'desc'
      },
      take: limit,
      select: {
        entityId: true,
        totalViews: true,
        viewsLast24h: true,
        viewsLast7d: true,
        viewsLast30d: true
      }
    });

    return metrics.map(m => ({
      entityId: m.entityId.toString(),
      views: period === '24h' ? m.viewsLast24h
        : period === '7d' ? m.viewsLast7d
        : period === '30d' ? m.viewsLast30d
        : m.totalViews
    }));
  } catch (error) {
    console.error('[ViewMetricsService] Erro ao obter top lotes:', error);
    return [];
  }
}
