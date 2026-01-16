// src/app/api/v1/admin/tenants/route.ts
/**
 * @fileoverview API para listar todos os tenants da plataforma.
 * 
 * Endpoint usado pelo BidExpertCRM para preencher a tabela principal
 * de gerenciamento de clientes com paginação, busca e filtros.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { validateAdminApiKey } from '@/lib/auth/admin-api-guard';

// Schema de validação dos query params
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['PENDING', 'TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED']).optional(),
  resolutionStrategy: z.enum(['SUBDOMAIN', 'PATH', 'CUSTOM_DOMAIN']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'status', 'usersCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  // 1. Validar API Key
  const authResult = await validateAdminApiKey(request);
  if (!authResult.isValid) {
    return NextResponse.json({ error: 'Unauthorized', message: authResult.error }, { status: 401 });
  }

  try {
    // 2. Parsear query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = querySchema.parse(searchParams);

    // 3. Construir filtros
    const where: any = {
      id: { not: BigInt(1) }, // Exclui o landlord
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { subdomain: { contains: params.search } },
        { customDomain: { contains: params.search } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.resolutionStrategy) {
      where.resolutionStrategy = params.resolutionStrategy;
    }

    // 4. Buscar total para paginação
    const total = await prisma.tenant.count({ where });

    // 5. Buscar tenants com paginação
    const tenants = await prisma.tenant.findMany({
      where,
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
      orderBy: params.sortBy === 'usersCount' 
        ? { users: { _count: params.sortOrder } }
        : { [params.sortBy]: params.sortOrder },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });

    // 6. Formatar resposta
    const formattedTenants = tenants.map((tenant: typeof tenants[number]) => ({
      id: tenant.id.toString(),
      name: tenant.name,
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain,
      status: tenant.status,
      resolutionStrategy: tenant.resolutionStrategy,
      customDomainVerified: tenant.customDomainVerified,
      planId: tenant.planId,
      maxUsers: tenant.maxUsers,
      maxStorageBytes: tenant.maxStorageBytes,
      maxAuctions: tenant.maxAuctions,
      externalId: tenant.externalId,
      trialStartedAt: tenant.trialStartedAt,
      trialExpiresAt: tenant.trialExpiresAt,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      // Contagens
      usersCount: tenant._count.users,
      auctionsCount: tenant._count.auctions,
      lotsCount: tenant._count.lots,
      // Settings
      isSetupComplete: tenant.settings?.isSetupComplete ?? false,
      siteTitle: tenant.settings?.siteTitle,
      logoUrl: tenant.settings?.logoUrl,
    }));

    return NextResponse.json({
      success: true,
      data: {
        tenants: formattedTenants,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit),
          hasMore: params.page * params.limit < total,
        },
      },
    });

  } catch (error) {
    console.error('[GET /api/v1/admin/tenants] Erro:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Parâmetros inválidos',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
