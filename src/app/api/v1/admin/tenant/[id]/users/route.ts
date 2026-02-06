// src/app/api/v1/admin/tenant/[id]/users/route.ts
/**
 * @fileoverview API para gerenciar usuários administrativos de um tenant.
 * 
 * Permite ao suporte do BidExpertCRM visualizar e gerenciar
 * usuários de um tenant específico.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { validateAdminApiKey } from '@/lib/auth/admin-api-guard';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  role: z.string().optional(),
  search: z.string().optional(),
});

export async function GET(
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
      select: { id: true, name: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    // 3. Parsear query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryParams = querySchema.parse(searchParams);

    // 4. Construir filtros
    const where: any = {
      UsersOnTenants: {
        some: { tenantId },
      },
    };

    if (queryParams.search) {
      where.OR = [
        { fullName: { contains: queryParams.search } },
        { email: { contains: queryParams.search } },
        { cpf: { contains: queryParams.search } },
      ];
    }

    if (queryParams.role) {
      where.UsersOnRoles = {
        some: { Role: { name: queryParams.role } },
      };
    }

    // 5. Buscar total e usuários
    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      include: {
        UsersOnRoles: {
          include: { Role: { select: { name: true } } },
        },
        UsersOnTenants: {
          where: { tenantId },
          select: { 
            isActive: true, 
            assignedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (queryParams.page - 1) * queryParams.limit,
      take: queryParams.limit,
    });

    // 6. Formatar resposta
    const formattedUsers = users.map(user => ({
      id: user.id.toString(),
      email: user.email,
      fullName: user.fullName,
      cpf: user.cpf,
      cellPhone: user.cellPhone,
      createdAt: user.createdAt,
      roles: (user as any).UsersOnRoles.map((ur: any) => ur.Role.name),
      tenantMembership: {
        isActive: (user as any).UsersOnTenants[0]?.isActive ?? true,
        joinedAt: (user as any).UsersOnTenants[0]?.assignedAt,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id.toString(),
          name: tenant.name,
        },
        users: formattedUsers,
        pagination: {
          page: queryParams.page,
          limit: queryParams.limit,
          total,
          totalPages: Math.ceil(total / queryParams.limit),
        },
      },
    });

  } catch (error) {
    console.error('[GET /api/v1/admin/tenant/[id]/users] Erro:', error);

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
