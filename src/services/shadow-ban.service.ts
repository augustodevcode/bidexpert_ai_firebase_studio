/**
 * @file shadow-ban.service.ts
 * @description Serviço para gerenciamento de Shadow Banning de usuários.
 * Shadow Banning permite que usuários suspeitos continuem participando do sistema
 * sem saber que estão banidos - seus lances são registrados mas não afetam o leilão.
 * 
 * BDD Scenarios:
 * - Dado que um usuário foi marcado como shadow banned
 * - Quando ele tenta dar um lance
 * - Então o lance aparece como registrado para ele
 * - Mas não é considerado na competição real do leilão
 * 
 * - Dado que um admin marca um usuário como suspeito
 * - Quando o sistema processa lances
 * - Então esses lances são logados para auditoria mas ignorados no ranking
 */
'use server';

import prisma from '@/lib/prisma';
import { getCurrentTenant } from '@/lib/tenant';

export type ShadowBanReason = 
  | 'SUSPICIOUS_BIDDING' 
  | 'MULTIPLE_ACCOUNTS' 
  | 'PAYMENT_FRAUD' 
  | 'BID_MANIPULATION'
  | 'SHILL_BIDDING'
  | 'INVESTIGATION_PENDING'
  | 'MANUAL_FLAG';

export interface ShadowBanRecord {
  userId: string;
  reason: ShadowBanReason;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

// Em produção, isso seria armazenado em DB. Por enquanto usando cache em memória
// com fallback para badges JSON do usuário.
const shadowBanCache = new Map<string, ShadowBanRecord>();

/**
 * Verifica se um usuário está shadow banned
 * @param userId - ID do usuário
 * @returns true se o usuário está shadow banned
 */
export async function isUserShadowBanned(userId: string): Promise<boolean> {
  try {
    // Verificar cache primeiro
    const cached = shadowBanCache.get(userId);
    if (cached && cached.isActive) {
      // Verificar se expirou
      if (cached.expiresAt && new Date() > cached.expiresAt) {
        shadowBanCache.delete(userId);
        return false;
      }
      return true;
    }

    // Verificar badges do usuário (campo JSON)
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { badges: true }
    });

    if (!user?.badges) return false;

    const badges = user.badges as Record<string, unknown>;
    return badges.shadowBanned === true;
  } catch (error) {
    console.error('[ShadowBanService] Erro ao verificar shadow ban:', error);
    return false;
  }
}

/**
 * Aplica shadow ban a um usuário
 * @param userId - ID do usuário a ser banido
 * @param reason - Motivo do ban
 * @param adminUserId - ID do admin que aplicou o ban
 * @param notes - Notas adicionais
 * @param expirationDays - Dias até expirar (null = permanente)
 */
export async function applyShadowBan(
  userId: string,
  reason: ShadowBanReason,
  adminUserId: string,
  notes?: string,
  expirationDays?: number
): Promise<{ success: boolean; message: string }> {
  try {
    const tenant = await getCurrentTenant();
    
    const record: ShadowBanRecord = {
      userId,
      reason,
      notes,
      createdBy: adminUserId,
      createdAt: new Date(),
      expiresAt: expirationDays ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000) : undefined,
      isActive: true
    };

    // Salvar no cache
    shadowBanCache.set(userId, record);

    // Atualizar badges do usuário para persistir
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { badges: true }
    });

    const currentBadges = (user?.badges as Record<string, unknown>) || {};
    const updatedBadges = {
      ...currentBadges,
      shadowBanned: true,
      shadowBanReason: reason,
      shadowBanCreatedAt: record.createdAt.toISOString(),
      shadowBanExpiresAt: record.expiresAt?.toISOString() || null,
      shadowBanNotes: notes
    };

    await prisma.user.update({
      where: { id: BigInt(userId) },
      data: { 
        badges: updatedBadges,
        updatedAt: new Date()
      }
    });

    // Log de auditoria (usando UPDATE pois shadow ban é uma alteração de estado)
    await prisma.audit_logs.create({
      data: {
        action: 'UPDATE',
        entityType: 'User',
        entityId: BigInt(userId),
        changes: { 
          operation: 'SHADOW_BAN_APPLIED',
          reason, 
          notes, 
          expirationDays 
        },
        userId: BigInt(adminUserId),
        tenantId: tenant?.tenantId ? BigInt(tenant.tenantId) : undefined
      }
    });

    console.log(`[ShadowBanService] Shadow ban aplicado ao usuário ${userId} por ${adminUserId}. Motivo: ${reason}`);

    return { 
      success: true, 
      message: `Shadow ban aplicado com sucesso. Motivo: ${getReasonLabel(reason)}` 
    };
  } catch (error) {
    console.error('[ShadowBanService] Erro ao aplicar shadow ban:', error);
    return { success: false, message: 'Erro ao aplicar shadow ban' };
  }
}

/**
 * Remove shadow ban de um usuário
 * @param userId - ID do usuário
 * @param adminUserId - ID do admin que removeu o ban
 */
export async function removeShadowBan(
  userId: string,
  adminUserId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const tenant = await getCurrentTenant();
    
    // Remover do cache
    shadowBanCache.delete(userId);

    // Atualizar badges do usuário
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { badges: true }
    });

    const currentBadges = (user?.badges as Record<string, unknown>) || {};
    const { 
      shadowBanned, 
      shadowBanReason, 
      shadowBanCreatedAt, 
      shadowBanExpiresAt,
      shadowBanNotes,
      ...restBadges 
    } = currentBadges;

    await prisma.user.update({
      where: { id: BigInt(userId) },
      data: { 
        badges: {
          ...restBadges,
          shadowBanned: false,
          shadowBanRemovedAt: new Date().toISOString(),
          shadowBanRemovedBy: adminUserId
        },
        updatedAt: new Date()
      }
    });

    // Log de auditoria (usando UPDATE pois shadow ban é uma alteração de estado)
    await prisma.audit_logs.create({
      data: {
        action: 'UPDATE',
        entityType: 'User',
        entityId: BigInt(userId),
        changes: { 
          operation: 'SHADOW_BAN_REMOVED',
          removedBy: adminUserId 
        },
        userId: BigInt(adminUserId),
        tenantId: tenant?.tenantId ? BigInt(tenant.tenantId) : undefined
      }
    });

    console.log(`[ShadowBanService] Shadow ban removido do usuário ${userId} por ${adminUserId}`);

    return { success: true, message: 'Shadow ban removido com sucesso' };
  } catch (error) {
    console.error('[ShadowBanService] Erro ao remover shadow ban:', error);
    return { success: false, message: 'Erro ao remover shadow ban' };
  }
}

/**
 * Obtém os detalhes do shadow ban de um usuário
 */
export async function getShadowBanDetails(userId: string): Promise<ShadowBanRecord | null> {
  try {
    const cached = shadowBanCache.get(userId);
    if (cached) return cached;

    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { badges: true }
    });

    if (!user?.badges) return null;

    const badges = user.badges as Record<string, unknown>;
    if (badges.shadowBanned !== true) return null;

    return {
      userId,
      reason: (badges.shadowBanReason as ShadowBanReason) || 'MANUAL_FLAG',
      notes: badges.shadowBanNotes as string,
      createdBy: 'unknown',
      createdAt: new Date(badges.shadowBanCreatedAt as string || Date.now()),
      expiresAt: badges.shadowBanExpiresAt ? new Date(badges.shadowBanExpiresAt as string) : undefined,
      isActive: true
    };
  } catch (error) {
    console.error('[ShadowBanService] Erro ao obter detalhes:', error);
    return null;
  }
}

/**
 * Lista todos os usuários com shadow ban ativo
 */
export async function listShadowBannedUsers(): Promise<{ id: string; fullName: string | null; email: string; reason: string; createdAt: string }[]> {
  try {
    const tenant = await getCurrentTenant();
    
    // Buscar usuários com shadow ban ativo
    const users = await prisma.user.findMany({
      where: {
        badges: {
          path: ['shadowBanned'],
          equals: true
        },
        UsersOnTenants: tenant?.tenantId ? {
          some: { tenantId: BigInt(tenant.tenantId) }
        } : undefined
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        badges: true
      }
    });

    return users.map(u => {
      const badges = u.badges as Record<string, unknown>;
      return {
        id: u.id.toString(),
        fullName: u.fullName,
        email: u.email,
        reason: getReasonLabel(badges.shadowBanReason as ShadowBanReason),
        createdAt: badges.shadowBanCreatedAt as string || 'N/A'
      };
    });
  } catch (error) {
    console.error('[ShadowBanService] Erro ao listar shadow banned:', error);
    return [];
  }
}

/**
 * Processa lance considerando shadow ban
 * Retorna true se o lance deve ser processado normalmente
 * Retorna false se o lance deve ser ignorado (usuário shadow banned)
 */
export async function shouldProcessBid(userId: string): Promise<{ 
  process: boolean; 
  isShadowBanned: boolean;
  reason?: string;
}> {
  const isBanned = await isUserShadowBanned(userId);
  
  if (isBanned) {
    const details = await getShadowBanDetails(userId);
    return {
      process: false,
      isShadowBanned: true,
      reason: details?.reason
    };
  }
  
  return {
    process: true,
    isShadowBanned: false
  };
}

function getReasonLabel(reason: ShadowBanReason | string): string {
  const labels: Record<string, string> = {
    'SUSPICIOUS_BIDDING': 'Padrão de lances suspeito',
    'MULTIPLE_ACCOUNTS': 'Múltiplas contas detectadas',
    'PAYMENT_FRAUD': 'Fraude de pagamento',
    'BID_MANIPULATION': 'Manipulação de lances',
    'SHILL_BIDDING': 'Shill Bidding (lances falsos)',
    'INVESTIGATION_PENDING': 'Investigação em andamento',
    'MANUAL_FLAG': 'Marcação manual'
  };
  return labels[reason] || reason;
}
