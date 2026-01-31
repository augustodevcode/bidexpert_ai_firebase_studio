// src/app/api/v1/admin/tenant/settings/route.ts
/**
 * @fileoverview API de Configuração de Tenant para Control Plane (BidExpertCRM).
 * 
 * Este endpoint permite atualizar configurações de branding, features e domínios
 * de um tenant em tempo real. Útil para:
 * - Atualizar logo/cores após o cliente fazer upload no CRM
 * - Habilitar/desabilitar features baseado no plano
 * - Configurar domínio customizado
 * - Atualizar status do tenant (suspender, cancelar, etc.)
 * 
 * SEGURANÇA:
 * - Protegido por ADMIN_API_KEY (header Authorization: Bearer <key>)
 * - Apenas o Control Plane deve ter acesso a esta key
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { validateAdminApiKey } from '@/lib/auth/admin-api-guard';
import { 
  generateDomainVerifyToken, 
  invalidateTenantCache 
} from '@/server/lib/tenant-context';

// Tipo para cliente de transação Prisma
type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// ============================================================================
// Schema de Validação
// ============================================================================

const updateTenantSettingsSchema = z.object({
  // Identificação do Tenant (obrigatório para saber qual atualizar)
  tenantId: z.string().min(1, "ID do tenant é obrigatório."),
  
  // Informações básicas do Tenant
  tenant: z.object({
    name: z.string().min(3).optional(),
    status: z.enum(['PENDING', 'TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED']).optional(),
    suspendedReason: z.string().optional(),
    planId: z.string().optional(),
    maxUsers: z.number().int().positive().optional(),
    maxStorageBytes: z.number().int().positive().optional(),
    maxAuctions: z.number().int().positive().optional(),
    webhookUrl: z.string().url().nullable().optional(),
    metadata: z.record(z.any()).optional(),
  }).optional(),
  
  // Configurações de Domínio
  domain: z.object({
    customDomain: z.string().nullable().optional(),
    resolutionStrategy: z.enum(['SUBDOMAIN', 'PATH', 'CUSTOM_DOMAIN']).optional(),
  }).optional(),
  
  // Branding (cores, logo, favicon)
  branding: z.object({
    siteTitle: z.string().optional(),
    siteTagline: z.string().optional(),
    logoUrl: z.string().url().nullable().optional(),
    logoMediaId: z.string().nullable().optional(),
    faviconUrl: z.string().url().nullable().optional(),
    primaryColorHsl: z.string().nullable().optional(),
    primaryForegroundHsl: z.string().nullable().optional(),
    secondaryColorHsl: z.string().nullable().optional(),
    secondaryForegroundHsl: z.string().nullable().optional(),
    accentColorHsl: z.string().nullable().optional(),
    accentForegroundHsl: z.string().nullable().optional(),
    destructiveColorHsl: z.string().nullable().optional(),
    mutedColorHsl: z.string().nullable().optional(),
    backgroundColorHsl: z.string().nullable().optional(),
    foregroundColorHsl: z.string().nullable().optional(),
    borderColorHsl: z.string().nullable().optional(),
    radiusValue: z.string().nullable().optional(),
    customCss: z.string().nullable().optional(),
    customHeadScripts: z.string().nullable().optional(),
    customFontUrl: z.string().url().nullable().optional(),
  }).optional(),
  
  // Feature Flags
  features: z.object({
    enableBlockchain: z.boolean().optional(),
    enableRealtime: z.boolean().optional(),
    enableSoftClose: z.boolean().optional(),
    enableDirectSales: z.boolean().optional(),
    enableMapSearch: z.boolean().optional(),
    enableAIFeatures: z.boolean().optional(),
  }).optional(),
  
  // Email Branding
  email: z.object({
    emailFromName: z.string().nullable().optional(),
    emailFromAddress: z.string().email().nullable().optional(),
    smsFromName: z.string().nullable().optional(),
  }).optional(),
});

export type UpdateTenantSettingsInput = z.infer<typeof updateTenantSettingsSchema>;

// ============================================================================
// Handler PATCH - Atualizar Configurações do Tenant
// ============================================================================

export async function PATCH(request: NextRequest) {
  // 1. Validar API Key
  const authResult = validateAdminApiKey(request);
  if (!authResult.isValid) {
    return authResult.error!;
  }

  try {
    // 2. Parse e validar body
    const body = await request.json();
    const validation = updateTenantSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Dados de configuração inválidos.',
        details: validation.error.flatten(),
      }, { status: 400 });
    }

    const data = validation.data;
    const tenantIdBigInt = BigInt(data.tenantId);

    // 3. Verificar se tenant existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: tenantIdBigInt },
      include: { settings: true },
    });

    if (!existingTenant) {
      return NextResponse.json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: `Tenant com ID '${data.tenantId}' não encontrado.`,
      }, { status: 404 });
    }

    // 4. Preparar atualizações
    const tenantUpdates: any = {};
    const settingsUpdates: any = {};

    // 4.1 Atualizações do Tenant
    if (data.tenant) {
      if (data.tenant.name) tenantUpdates.name = data.tenant.name;
      if (data.tenant.status) {
        tenantUpdates.status = data.tenant.status;
        
        // Atualizar timestamps baseado no status
        if (data.tenant.status === 'ACTIVE' && existingTenant.status !== 'ACTIVE') {
          tenantUpdates.activatedAt = new Date();
        }
        if (data.tenant.status === 'SUSPENDED') {
          tenantUpdates.suspendedAt = new Date();
          tenantUpdates.suspendedReason = data.tenant.suspendedReason || 'Suspenso via API';
        }
      }
      if (data.tenant.planId !== undefined) tenantUpdates.planId = data.tenant.planId;
      if (data.tenant.maxUsers !== undefined) tenantUpdates.maxUsers = data.tenant.maxUsers;
      if (data.tenant.maxStorageBytes !== undefined) tenantUpdates.maxStorageBytes = BigInt(data.tenant.maxStorageBytes);
      if (data.tenant.maxAuctions !== undefined) tenantUpdates.maxAuctions = data.tenant.maxAuctions;
      if (data.tenant.webhookUrl !== undefined) tenantUpdates.webhookUrl = data.tenant.webhookUrl;
      if (data.tenant.metadata !== undefined) tenantUpdates.metadata = data.tenant.metadata;
    }

    // 4.2 Atualizações de Domínio
    if (data.domain) {
      if (data.domain.resolutionStrategy) {
        tenantUpdates.resolutionStrategy = data.domain.resolutionStrategy;
      }
      if (data.domain.customDomain !== undefined) {
        // Se mudou o domínio, resetar verificação
        if (data.domain.customDomain !== existingTenant.domain) {
          tenantUpdates.domain = data.domain.customDomain?.toLowerCase() || null;
          tenantUpdates.customDomainVerified = false;
          tenantUpdates.customDomainVerifyToken = data.domain.customDomain 
            ? generateDomainVerifyToken() 
            : null;
        }
      }
    }

    // 4.3 Atualizações de Branding (PlatformSettings)
    if (data.branding) {
      Object.assign(settingsUpdates, data.branding);

      if (data.branding.logoMediaId !== undefined || data.branding.logoUrl !== undefined) {
        const normalizedLogoMediaId = data.branding.logoMediaId
          ? BigInt(data.branding.logoMediaId)
          : null;

        if (!normalizedLogoMediaId) {
          if (data.branding.logoUrl) {
            return NextResponse.json({
              success: false,
              error: 'INVALID_LOGO_SOURCE',
              message: 'O logo deve vir da biblioteca de mídia do tenant.',
            }, { status: 400 });
          }
          settingsUpdates.logoMediaId = null;
          settingsUpdates.logoUrl = null;
        } else {
          const mediaItem = await prisma.mediaItem.findFirst({
            where: {
              id: normalizedLogoMediaId,
              tenantId: tenantIdBigInt,
            },
          });

          if (!mediaItem) {
            return NextResponse.json({
              success: false,
              error: 'LOGO_NOT_FOUND',
              message: 'Logo inválido. Selecione um item existente na biblioteca de mídia.',
            }, { status: 404 });
          }

          settingsUpdates.logoMediaId = normalizedLogoMediaId;
          settingsUpdates.logoUrl = mediaItem.urlLarge || mediaItem.urlMedium || mediaItem.urlOriginal || mediaItem.urlThumbnail || null;
        }
      }
    }

    // 4.4 Atualizações de Features
    if (data.features) {
      Object.assign(settingsUpdates, data.features);
    }

    // 4.5 Atualizações de Email
    if (data.email) {
      Object.assign(settingsUpdates, data.email);
    }

    // 5. Executar atualizações em transação
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Atualizar Tenant
      let updatedTenant = existingTenant;
      if (Object.keys(tenantUpdates).length > 0) {
        updatedTenant = await tx.tenant.update({
          where: { id: tenantIdBigInt },
          data: tenantUpdates,
        });
      }

      // Atualizar ou criar PlatformSettings
      let updatedSettings = existingTenant.settings;
      if (Object.keys(settingsUpdates).length > 0) {
        if (existingTenant.settings) {
          updatedSettings = await tx.platformSettings.update({
            where: { tenantId: tenantIdBigInt },
            data: settingsUpdates,
          });
        } else {
          updatedSettings = await tx.platformSettings.create({
            data: {
              tenantId: tenantIdBigInt,
              ...settingsUpdates,
            },
          });
        }
      }

      return { tenant: updatedTenant, settings: updatedSettings };
    });

    // 6. Invalidar cache
    invalidateTenantCache(data.tenantId);

    // 7. Retornar resultado
    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas com sucesso.',
      data: {
        tenant: {
          id: result.tenant.id.toString(),
          name: result.tenant.name,
          subdomain: result.tenant.subdomain,
          domain: result.tenant.domain,
          status: result.tenant.status,
          resolutionStrategy: result.tenant.resolutionStrategy,
          customDomainVerified: result.tenant.customDomainVerified,
          customDomainVerifyToken: result.tenant.customDomainVerifyToken,
        },
        settings: result.settings ? {
          siteTitle: result.settings.siteTitle,
          siteTagline: result.settings.siteTagline,
          logoUrl: result.settings.logoUrl,
          faviconUrl: result.settings.faviconUrl,
          primaryColorHsl: result.settings.primaryColorHsl,
          isSetupComplete: result.settings.isSetupComplete,
          enableBlockchain: result.settings.enableBlockchain,
          enableRealtime: result.settings.enableRealtime,
          enableSoftClose: result.settings.enableSoftClose,
        } : null,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Settings API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: `Erro interno ao atualizar configurações: ${error.message}`,
    }, { status: 500 });
  }
}

// ============================================================================
// Handler GET - Obter Configurações do Tenant
// ============================================================================

export async function GET(request: NextRequest) {
  // 1. Validar API Key
  const authResult = validateAdminApiKey(request);
  if (!authResult.isValid) {
    return authResult.error!;
  }

  try {
    // 2. Obter tenantId da query string
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_TENANT_ID',
        message: 'Parâmetro tenantId é obrigatório.',
      }, { status: 400 });
    }

    // 3. Buscar tenant com settings
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

    if (!tenant) {
      return NextResponse.json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: `Tenant com ID '${tenantId}' não encontrado.`,
      }, { status: 404 });
    }

    // 4. Retornar dados completos
    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id.toString(),
          name: tenant.name,
          subdomain: tenant.subdomain,
          domain: tenant.domain,
          status: tenant.status,
          resolutionStrategy: tenant.resolutionStrategy,
          customDomainVerified: tenant.customDomainVerified,
          customDomainVerifyToken: tenant.customDomainVerifyToken,
          trialStartedAt: tenant.trialStartedAt?.toISOString(),
          trialExpiresAt: tenant.trialExpiresAt?.toISOString(),
          activatedAt: tenant.activatedAt?.toISOString(),
          suspendedAt: tenant.suspendedAt?.toISOString(),
          suspendedReason: tenant.suspendedReason,
          planId: tenant.planId,
          maxUsers: tenant.maxUsers,
          maxStorageBytes: tenant.maxStorageBytes?.toString(),
          maxAuctions: tenant.maxAuctions,
          externalId: tenant.externalId,
          apiKey: tenant.apiKey,
          webhookUrl: tenant.webhookUrl,
          metadata: tenant.metadata,
          createdAt: tenant.createdAt.toISOString(),
          updatedAt: tenant.updatedAt.toISOString(),
        },
        settings: tenant.settings ? {
          siteTitle: tenant.settings.siteTitle,
          siteTagline: tenant.settings.siteTagline,
          logoUrl: tenant.settings.logoUrl,
          faviconUrl: tenant.settings.faviconUrl,
          primaryColorHsl: tenant.settings.primaryColorHsl,
          primaryForegroundHsl: tenant.settings.primaryForegroundHsl,
          secondaryColorHsl: tenant.settings.secondaryColorHsl,
          isSetupComplete: tenant.settings.isSetupComplete,
          enableBlockchain: tenant.settings.enableBlockchain,
          enableRealtime: tenant.settings.enableRealtime,
          enableSoftClose: tenant.settings.enableSoftClose,
          enableDirectSales: tenant.settings.enableDirectSales,
          enableMapSearch: tenant.settings.enableMapSearch,
          enableAIFeatures: tenant.settings.enableAIFeatures,
          customCss: tenant.settings.customCss,
          customHeadScripts: tenant.settings.customHeadScripts,
          customFontUrl: tenant.settings.customFontUrl,
          emailFromName: tenant.settings.emailFromName,
          emailFromAddress: tenant.settings.emailFromAddress,
        } : null,
        usage: {
          usersCount: tenant._count.users,
          auctionsCount: tenant._count.auctions,
          lotsCount: tenant._count.lots,
        },
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Settings API GET] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: `Erro interno ao obter configurações: ${error.message}`,
    }, { status: 500 });
  }
}
