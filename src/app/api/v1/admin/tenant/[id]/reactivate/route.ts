// src/app/api/v1/admin/tenant/[id]/reactivate/route.ts
/**
 * @fileoverview API para reativar um tenant suspenso.
 * 
 * Usado pelo BidExpertCRM após regularização de pagamento
 * ou resolução de problemas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { validateAdminApiKey } from '@/lib/auth/admin-api-guard';
import { invalidateTenantCache } from '@/server/lib/tenant-context';

const reactivateSchema = z.object({
  reason: z.string().optional(),
  notifyAdmin: z.boolean().default(true),
  newStatus: z.enum(['ACTIVE', 'TRIAL']).default('ACTIVE'),
  extendTrialDays: z.number().min(1).max(90).optional(), // Estender trial se reativando como TRIAL
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Validar API Key
  const authResult = await validateAdminApiKey(request);
  if (!authResult.isValid) {
    return NextResponse.json({ error: 'Unauthorized', message: authResult.error }, { status: 401 });
  }

  try {
    const tenantId = BigInt(params.id);
    
    // 2. Verificar se tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          where: {
            usersOnRoles: {
              some: { role: { name: { in: ['ADMIN', 'Administrator'] } } }
            }
          },
          select: { email: true, fullName: true },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    if (tenant.status !== 'SUSPENDED' && tenant.status !== 'EXPIRED' && tenant.status !== 'CANCELLED') {
      return NextResponse.json({ 
        error: 'Tenant não está em estado que permite reativação',
        currentStatus: tenant.status,
      }, { status: 409 });
    }

    // 3. Parsear body
    const body = await request.json();
    const data = reactivateSchema.parse(body);

    // 4. Calcular nova data de trial se aplicável
    let trialExpiresAt = tenant.trialExpiresAt;
    if (data.newStatus === 'TRIAL' && data.extendTrialDays) {
      trialExpiresAt = new Date(Date.now() + data.extendTrialDays * 24 * 60 * 60 * 1000);
    }

    // 5. Reativar tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: data.newStatus,
        trialExpiresAt: data.newStatus === 'TRIAL' ? trialExpiresAt : tenant.trialExpiresAt,
        metadata: {
          ...(tenant.metadata as object || {}),
          reactivatedAt: new Date().toISOString(),
          reactivatedReason: data.reason || 'Reativação manual',
          previousStatus: tenant.status,
        },
      },
    });

    // 6. Invalidar cache
    if (tenant.subdomain) {
      invalidateTenantCache(tenant.subdomain);
    }
    if (tenant.customDomain) {
      invalidateTenantCache(tenant.customDomain);
    }

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: updatedTenant.id.toString(),
          name: updatedTenant.name,
          status: updatedTenant.status,
          reactivatedAt: new Date().toISOString(),
          trialExpiresAt: updatedTenant.trialExpiresAt,
        },
        adminNotified: data.notifyAdmin,
        adminEmail: tenant.users[0]?.email || null,
      },
    });

  } catch (error) {
    console.error('[POST /api/v1/admin/tenant/[id]/reactivate] Erro:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
