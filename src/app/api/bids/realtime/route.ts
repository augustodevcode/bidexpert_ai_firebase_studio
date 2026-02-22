/**
 * @fileoverview API Route de polling fallback para ambientes sem WebSocket.
 * Retorna os últimos lances de um lote ou leilão, ordenados por timestamp desc.
 * Usado quando communicationStrategy = 'POLLING' ou como fallback.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lotId = searchParams.get('lotId');
    const auctionId = searchParams.get('auctionId');
    const since = searchParams.get('since'); // ISO timestamp
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    if (!lotId && !auctionId) {
      return NextResponse.json({ error: 'lotId ou auctionId é obrigatório' }, { status: 400 });
    }

    const where: any = {};
    if (lotId) where.lotId = BigInt(lotId);
    if (auctionId) where.auctionId = BigInt(auctionId);
    if (since) where.timestamp = { gt: new Date(since) };

    const bids = await prisma.bid.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        lotId: true,
        auctionId: true,
        bidderId: true,
        amount: true,
        timestamp: true,
        bidderDisplay: true,
        bidderAlias: true,
        bidOrigin: true,
        isAutoBid: true,
        status: true,
      },
    });

    // Also return current lot state
    let lotState = null;
    if (lotId) {
      const lot = await prisma.lot.findUnique({
        where: { id: BigInt(lotId) },
        select: {
          id: true, price: true, bidsCount: true, status: true, endDate: true,
        },
      });
      if (lot) {
        lotState = {
          id: lot.id.toString(),
          price: Number(lot.price),
          bidsCount: lot.bidsCount,
          status: lot.status,
          endDate: lot.endDate?.toISOString() || null,
        };
      }
    }

    return NextResponse.json({
      bids: bids.map(b => ({
        id: b.id.toString(),
        lotId: b.lotId.toString(),
        auctionId: b.auctionId.toString(),
        bidderId: b.bidderId.toString(),
        amount: Number(b.amount),
        timestamp: b.timestamp.toISOString(),
        bidderDisplay: b.bidderDisplay || b.bidderAlias || 'Anônimo',
        bidOrigin: b.bidOrigin,
        isAutoBid: b.isAutoBid,
        status: b.status,
      })),
      lotState,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /bids/realtime] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
