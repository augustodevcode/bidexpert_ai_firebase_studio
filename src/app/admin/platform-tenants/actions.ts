// src/app/admin/platform-tenants/actions.ts
/**
 * @fileoverview Server Actions para gerenciamento de tenants da plataforma.
 * 
 * Estas actions são usadas pelo painel de administração do landlord para:
 * - Listar todos os tenants
 * - Visualizar detalhes de um tenant
 * - Atualizar configurações de um tenant
 * - Suspender/Reativar tenants
 * 
 * IMPORTANTE: Estas actions só devem ser acessíveis por admins do landlord (tenant 1).
 */

'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/server/lib/session';
import { revalidatePath } from 'next/cache';
import { invalidateTenantCache } from '@/server/lib/tenant-context';
import type { Tenant, PlatformSettings, TenantStatus, ResolutionStrategy } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

export interface TenantWithSettings extends Tenant {
  settings: PlatformSettings | null;
  _count: {
    users: number;
    auctions: number;
    lots: number;
  };
}

export interface TenantListItem {
  id: string;
  name: string;
  subdomain: string;
  domain: string | null;
  status: TenantStatus;
  resolutionStrategy: ResolutionStrategy;
  customDomainVerified: boolean;
  planId: string | null;
  trialExpiresAt: Date | null;
  createdAt: Date;
  usersCount: number;
  auctionsCount: number;
  lotsCount: number;
  isSetupComplete: boolean;
}

// ============================================================================
// Validação de Acesso
// ============================================================================

async function validateLandlordAccess(): Promise<{ isValid: boolean; error?: string }> {
  const session = await getSession();
  
  if (!session) {
    return { isValid: false, error: 'Não autenticado.' };
  }
  
  // Apenas tenant 1 (landlord) pode acessar
  if (session.tenantId !== '1') {
    return { isValid: false, error: 'Acesso negado. Apenas administradores da plataforma.' };
  }
  
  // Verificar se tem permissão de admin
  const hasAdminPermission = session.permissions?.includes('manage_tenants') || 
                              session.roleNames?.includes('ADMIN') ||
                              session.roleNames?.includes('Administrator');
  
  if (!hasAdminPermission) {
    return { isValid: false, error: 'Permissão insuficiente.' };
  }
  
  return { isValid: true };
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Lista todos os tenants da plataforma (exceto o landlord).
 */
export async function getPlatformTenants(): Promise<TenantListItem[]> {
  const access = await validateLandlordAccess();
  if (!access.isValid) {
    throw new Error(access.error);
  }

  const tenants = await prisma.tenant.findMany({
    where: {
      id: { not: BigInt(1) }, // Exclui o landlord
    },
    include: {
      settings: {
        select: {
          isSetupComplete: true,
          siteTitle: true,
          logoUrl: true,
        },
      },
      _count: {
        select: {
          users: true,
          auctions: true,
          lots: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tenants.map((tenant: typeof tenants[number]) => ({
    id: tenant.id.toString(),
    name: tenant.name,
    subdomain: tenant.subdomain,
    domain: tenant.customDomain,
    status: tenant.status,
    resolutionStrategy: tenant.resolutionStrategy,
    customDomainVerified: tenant.customDomainVerified,
    planId: tenant.planId,
    trialExpiresAt: tenant.trialExpiresAt,
    createdAt: tenant.createdAt,
    usersCount: tenant._count.users,
    auctionsCount: tenant._count.auctions,
    lotsCount: tenant._count.lots,
    isSetupComplete: tenant.settings?.isSetupComplete ?? false,
  }));
}

/**
 * Obtém detalhes completos de um tenant.
 */
export async function getTenantDetails(tenantId: string): Promise<TenantWithSettings | null> {
  const access = await validateLandlordAccess();
  if (!access.isValid) {
    throw new Error(access.error);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: BigInt(tenantId) },
    include: {
      settings: true,
      _count: {
        select: {
          users: true,
          auctions: true,
          lots: true,
        },
      },
    },
  });

  return tenant as TenantWithSettings | null;
}

/**
 * Atualiza o status de um tenant.
 */
export async function updateTenantStatus(
  tenantId: string, 
  status: TenantStatus,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const access = await validateLandlordAccess();
  if (!access.isValid) {
    return { success: false, message: access.error! };
  }

  try {
    const updateData: any = { status };
    
    if (status === 'SUSPENDED') {
      updateData.suspendedAt = new Date();
      updateData.suspendedReason = reason || 'Suspenso pelo administrador';
    } else if (status === 'ACTIVE') {
      updateData.activatedAt = new Date();
      updateData.suspendedAt = null;
      updateData.suspendedReason = null;
    }

    await prisma.tenant.update({
      where: { id: BigInt(tenantId) },
      data: updateData,
    });

    invalidateTenantCache(tenantId);
    revalidatePath('/admin/platform-tenants');

    return { success: true, message: `Status atualizado para ${status}.` };
  } catch (error: any) {
    return { success: false, message: `Erro ao atualizar status: ${error.message}` };
  }
}

/**
 * Atualiza os limites de um tenant.
 */
export async function updateTenantLimits(
  tenantId: string,
  limits: {
    maxUsers?: number;
    maxAuctions?: number;
    maxStorageBytes?: string;
    planId?: string;
  }
): Promise<{ success: boolean; message: string }> {
  const access = await validateLandlordAccess();
  if (!access.isValid) {
    return { success: false, message: access.error! };
  }

  try {
    const updateData: any = {};
    
    if (limits.maxUsers !== undefined) updateData.maxUsers = limits.maxUsers;
    if (limits.maxAuctions !== undefined) updateData.maxAuctions = limits.maxAuctions;
    if (limits.maxStorageBytes !== undefined) updateData.maxStorageBytes = BigInt(limits.maxStorageBytes);
    if (limits.planId !== undefined) updateData.planId = limits.planId;

    await prisma.tenant.update({
      where: { id: BigInt(tenantId) },
      data: updateData,
    });

    invalidateTenantCache(tenantId);
    revalidatePath('/admin/platform-tenants');

    return { success: true, message: 'Limites atualizados com sucesso.' };
  } catch (error: any) {
    return { success: false, message: `Erro ao atualizar limites: ${error.message}` };
  }
}

/**
 * Regenera a API Key de um tenant.
 */
export async function regenerateTenantApiKey(tenantId: string): Promise<{ success: boolean; message: string; apiKey?: string }> {
  const access = await validateLandlordAccess();
  if (!access.isValid) {
    return { success: false, message: access.error! };
  }

  try {
    const newApiKey = `bx_${crypto.randomUUID().replace(/-/g, '')}`;
    
    await prisma.tenant.update({
      where: { id: BigInt(tenantId) },
      data: { apiKey: newApiKey },
    });

    invalidateTenantCache(tenantId);

    return { 
      success: true, 
      message: 'API Key regenerada com sucesso.',
      apiKey: newApiKey,
    };
  } catch (error: any) {
    return { success: false, message: `Erro ao regenerar API Key: ${error.message}` };
  }
}

/**
 * Verifica um domínio customizado.
 */
export async function verifyCustomDomain(tenantId: string): Promise<{ success: boolean; message: string }> {
  const access = await validateLandlordAccess();
  if (!access.isValid) {
    return { success: false, message: access.error! };
  }

  try {
    // Em produção, aqui verificaria se o DNS está configurado corretamente
    // Por agora, apenas marca como verificado
    await prisma.tenant.update({
      where: { id: BigInt(tenantId) },
      data: { customDomainVerified: true },
    });

    invalidateTenantCache(tenantId);
    revalidatePath('/admin/platform-tenants');

    return { success: true, message: 'Domínio verificado com sucesso.' };
  } catch (error: any) {
    return { success: false, message: `Erro ao verificar domínio: ${error.message}` };
  }
}

/**
 * Estatísticas gerais dos tenants.
 */
export async function getPlatformStats(): Promise<{
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  totalAuctions: number;
  totalLots: number;
}> {
  const access = await validateLandlordAccess();
  if (!access.isValid) {
    throw new Error(access.error);
  }

  const [
    totalTenants,
    activeTenants,
    trialTenants,
    suspendedTenants,
    totalUsers,
    totalAuctions,
    totalLots,
  ] = await Promise.all([
    prisma.tenant.count({ where: { id: { not: BigInt(1) } } }),
    prisma.tenant.count({ where: { id: { not: BigInt(1) }, status: 'ACTIVE' } }),
    prisma.tenant.count({ where: { id: { not: BigInt(1) }, status: 'TRIAL' } }),
    prisma.tenant.count({ where: { id: { not: BigInt(1) }, status: 'SUSPENDED' } }),
    prisma.usersOnTenants.count({ where: { tenantId: { not: BigInt(1) } } }),
    prisma.auction.count({ where: { tenantId: { not: BigInt(1) } } }),
    prisma.lot.count({ where: { tenantId: { not: BigInt(1) } } }),
  ]);

  return {
    totalTenants,
    activeTenants,
    trialTenants,
    suspendedTenants,
    totalUsers,
    totalAuctions,
    totalLots,
  };
}
