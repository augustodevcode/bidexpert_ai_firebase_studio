/**
 * @fileoverview API route para persistência dos lotes favoritos do investidor.
 * Mantém a lista sincronizada por usuário autenticado e tenant, com suporte a
 * leitura, inclusão em lote e remoção individual.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/server/lib/session';

export const dynamic = 'force-dynamic';

function normalizeLotIds(value: unknown): bigint[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .filter((lotId): lotId is string => typeof lotId === 'string' && /^\d+$/.test(lotId))
        .map(lotId => BigInt(lotId))
    )
  );
}

async function getAuthenticatedContext() {
  const session = await getSession();

  if (!session?.userId || !session?.tenantId) {
    return null;
  }

  return {
    userId: BigInt(session.userId),
    tenantId: BigInt(session.tenantId),
  };
}

export async function GET() {
  try {
    const context = await getAuthenticatedContext();

    if (!context) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const favoriteLots = await prisma.favoriteLot.findMany({
      where: {
        userId: context.userId,
        tenantId: context.tenantId,
      },
      select: {
        lotId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      ids: favoriteLots.map(favorite => favorite.lotId.toString()),
    });
  } catch (error) {
    console.error('Erro ao buscar lotes favoritos persistidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getAuthenticatedContext();

    if (!context) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const lotIds = normalizeLotIds(body?.lotIds ?? (body?.lotId ? [body.lotId] : []));

    if (lotIds.length === 0) {
      return NextResponse.json({ error: 'Nenhum lote válido informado' }, { status: 400 });
    }

    const existingLots = await prisma.lot.findMany({
      where: {
        id: { in: lotIds },
        tenantId: context.tenantId,
      },
      select: {
        id: true,
      },
    });

    const validLotIds = existingLots.map(lot => lot.id);

    if (validLotIds.length === 0) {
      return NextResponse.json({ error: 'Nenhum lote do tenant informado foi encontrado' }, { status: 404 });
    }

    await prisma.favoriteLot.createMany({
      data: validLotIds.map(lotId => ({
        userId: context.userId,
        tenantId: context.tenantId,
        lotId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      ids: validLotIds.map(lotId => lotId.toString()),
    });
  } catch (error) {
    console.error('Erro ao persistir lotes favoritos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await getAuthenticatedContext();

    if (!context) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const [lotId] = normalizeLotIds(body?.lotId ? [body.lotId] : []);

    if (!lotId) {
      return NextResponse.json({ error: 'Lote inválido' }, { status: 400 });
    }

    await prisma.favoriteLot.deleteMany({
      where: {
        userId: context.userId,
        tenantId: context.tenantId,
        lotId,
      },
    });

    return NextResponse.json({ success: true, lotId: lotId.toString() });
  } catch (error) {
    console.error('Erro ao remover lote favorito persistido:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}