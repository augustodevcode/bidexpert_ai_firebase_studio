/**
 * @fileoverview API route para simulação de custos de aquisição do lote.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getCommissionRatePercent } from '@/lib/lot-bid-planning';
import { buildCostSimulation } from '@/lib/lots/cost-simulation-engine';

export const dynamic = 'force-dynamic';

interface CostSimulationRequest {
  purchasePrice: number;
  commissionRatePercent?: number;
  legalFeesFixed?: number;
  notaryFeesFixed?: number;
  documentationFeesFixed?: number;
}

function buildLotWhereInput(lotId: string) {
  return /^\d+$/.test(lotId) ? { id: BigInt(lotId) } : { publicId: lotId };
}

async function getLotSimulationContext(lotId: string) {
  const lot = await prisma.lot.findUnique({
    where: buildLotWhereInput(lotId),
    include: {
      Auction: {
        include: {
          LotCategory: true,
        },
      },
      LotCategory: true,
    },
  });

  if (!lot) {
    return null;
  }

  const platformSettings = await prisma.platformSettings.findFirst({
    where: { tenantId: lot.tenantId },
  });

  return {
    lot,
    categoryName: lot.Auction?.LotCategory?.name || lot.LotCategory?.name || null,
    commissionRatePercent: getCommissionRatePercent(platformSettings as any),
  };
}

function buildResponse(lotId: string, requestBody: CostSimulationRequest, context: NonNullable<Awaited<ReturnType<typeof getLotSimulationContext>>>) {
  const simulation = buildCostSimulation({
    purchasePrice: requestBody.purchasePrice,
    config: {
      categoryName: context.categoryName,
      stateUf: context.lot.stateUf,
      commissionRatePercent: requestBody.commissionRatePercent ?? context.commissionRatePercent,
      legalFeesFixed: requestBody.legalFeesFixed,
      notaryFeesFixed: requestBody.notaryFeesFixed,
      documentationFeesFixed: requestBody.documentationFeesFixed,
    },
  });

  return {
    lotId,
    purchasePrice: simulation.purchasePrice,
    commissionRatePercent: simulation.commissionRatePercent,
    categoryType: simulation.categoryType,
    costs: simulation.items,
    totalCosts: simulation.totalCosts,
    totalWithPurchase: simulation.totalInvestment,
    effectiveRate: simulation.costPercentage,
    disclaimer: simulation.disclaimer,
  };
}

export async function POST(request: NextRequest, { params }: { params: { lotId: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json() as CostSimulationRequest;
    if (!body.purchasePrice || body.purchasePrice <= 0) {
      return NextResponse.json({ error: 'Preço de compra inválido' }, { status: 400 });
    }

    const context = await getLotSimulationContext(params.lotId);
    if (!context) {
      return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 });
    }

    return NextResponse.json(buildResponse(params.lotId, body, context));
  } catch (error) {
    console.error('Erro na simulação de custos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { lotId: string } }) {
  try {
    const purchasePrice = Number(new URL(request.url).searchParams.get('price') || 0);
    if (!purchasePrice || purchasePrice <= 0) {
      return NextResponse.json({ error: "Parâmetro 'price' é obrigatório" }, { status: 400 });
    }

    const context = await getLotSimulationContext(params.lotId);
    if (!context) {
      return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 });
    }

    return NextResponse.json(buildResponse(params.lotId, { purchasePrice }, context));
  } catch (error) {
    console.error('Erro ao obter simulação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
