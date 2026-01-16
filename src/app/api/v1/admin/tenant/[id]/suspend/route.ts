// src/app/api/v1/admin/tenant/[id]/suspend/route.ts
/**
 * @fileoverview API para suspender um tenant.
 * 
 * Usado pelo BidExpertCRM para gestão de inadimplência (Dunning)
 * ou violação de termos de uso.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { validateAdminApiKey } from '@/lib/auth/admin-api-guard';
import { invalidateTenantCache } from '@/server/lib/tenant-context';

const suspendSchema = z.object({
  reason: z.string().min(1, "Motivo da suspensão é obrigatório."),
  notifyAdmin: z.boolean().default(true),
  suspendedUntil: z.string().datetime().optional(), // Data de suspensão temporária
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

    if (tenant.id === BigInt(1)) {
      return NextResponse.json({ error: 'Não é permitido suspender o tenant principal' }, { status: 403 });
    }

    if (tenant.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Tenant já está suspenso' }, { status: 409 });
    }

    // 3. Parsear body
    const body = await request.json();
    const data = suspendSchema.parse(body);

    // 4. Suspender tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'SUSPENDED',
        metadata: {
          ...(tenant.metadata as object || {}),
          suspendedAt: new Date().toISOString(),
          suspendedReason: data.reason,
          suspendedUntil: data.suspendedUntil || null,
          previousStatus: tenant.status,
        },
      },
    });

    // 5. Invalidar cache
    if (tenant.subdomain) {
      invalidateTenantCache(tenant.subdomain);
    }
    if (tenant.customDomain) {
      invalidateTenantCache(tenant.customDomain);
    }

    // 6. TODO: Enviar notificação ao admin do tenant (se notifyAdmin = true)
    // Isso seria feito via serviço de email

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: updatedTenant.id.toString(),
          name: updatedTenant.name,
          status: updatedTenant.status,
          suspendedAt: new Date().toISOString(),
          suspendedReason: data.reason,
          suspendedUntil: data.suspendedUntil || null,
        },
        adminNotified: data.notifyAdmin,
        adminEmail: tenant.users[0]?.email || null,
      },
    });

  } catch (error) {
    console.error('[POST /api/v1/admin/tenant/[id]/suspend] Erro:', error);
    
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
