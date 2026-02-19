/**
 * @fileoverview Endpoint de teste E2E para validar concorrência de lances
 * no repositório de bids com estratégia check-and-set atômica.
 */
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { BidService } from '@/services/bid.service';

export const dynamic = 'force-dynamic';

interface ConcurrencyResult {
  status: 'fulfilled' | 'rejected';
  bidderId: string;
  detail: string;
}

export async function POST() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Endpoint indisponível em produção.' },
        { status: 403 }
      );
    }

    const lot = await prisma.lot.findFirst({
      where: {
        status: 'ABERTO_PARA_LANCES',
      },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        auctionId: true,
        tenantId: true,
        price: true,
        bidIncrementStep: true,
      },
    });

    if (!lot) {
      return NextResponse.json(
        { success: false, message: 'Nenhum lote aberto para lances encontrado.' },
        { status: 404 }
      );
    }

    const bidders = await prisma.user.findMany({
      where: {
        tenantId: lot.tenantId,
      },
      orderBy: { id: 'asc' },
      take: 2,
      select: {
        id: true,
        fullName: true,
      },
    });

    if (bidders.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Usuários insuficientes para teste concorrente.' },
        { status: 422 }
      );
    }

    const initialBidCount = await prisma.bid.count({ where: { lotId: lot.id } });

    const currentPrice = Number(lot.price ?? 0);
    const increment = Number(lot.bidIncrementStep ?? 100);
    const bidAmount = currentPrice + increment;

    const bidService = new BidService();

    const makeBidInput = (bidderId: bigint, bidderDisplay: string | null) => ({
      lotId: lot.id,
      auctionId: lot.auctionId,
      bidderId,
      tenantId: lot.tenantId,
      amount: new Prisma.Decimal(bidAmount),
      bidderDisplay: bidderDisplay ?? 'Teste Concorrência',
      Lot: { connect: { id: lot.id } },
      Auction: { connect: { id: lot.auctionId } },
      User: { connect: { id: bidderId } },
      Tenant: { connect: { id: lot.tenantId } },
    });

    const [bidderA, bidderB] = bidders;

    const [aResult, bResult] = await Promise.allSettled([
      bidService.createBid(makeBidInput(bidderA.id, bidderA.fullName) as any, {
        sessionId: 'e2e-concurrency-a',
      }),
      bidService.createBid(makeBidInput(bidderB.id, bidderB.fullName) as any, {
        sessionId: 'e2e-concurrency-b',
      }),
    ]);

    const mapped: ConcurrencyResult[] = [
      {
        status: aResult.status,
        bidderId: bidderA.id.toString(),
        detail: aResult.status === 'fulfilled' ? aResult.value.id.toString() : String(aResult.reason),
      },
      {
        status: bResult.status,
        bidderId: bidderB.id.toString(),
        detail: bResult.status === 'fulfilled' ? bResult.value.id.toString() : String(bResult.reason),
      },
    ];

    const successCount = mapped.filter((item) => item.status === 'fulfilled').length;
    const failureCount = mapped.filter((item) => item.status === 'rejected').length;

    const finalBidCount = await prisma.bid.count({ where: { lotId: lot.id } });

    const passed = successCount === 1 && failureCount === 1 && finalBidCount === initialBidCount + 1;

    return NextResponse.json({
      success: passed,
      lotId: lot.id.toString(),
      bidAmount,
      initialBidCount,
      finalBidCount,
      successCount,
      failureCount,
      results: mapped,
      message: passed
        ? 'Teste concorrente validado: 1 sucesso e 1 rejeição.'
        : 'Teste concorrente não atingiu resultado esperado.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Falha ao executar teste de concorrência.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
