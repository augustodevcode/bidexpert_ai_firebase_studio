/**
 * @file src/app/api/lots/[lotId]/bid-history/route.ts
 * @description API route para histórico de lances anonimizado.
 * Retorna lances com dados anonimizados para transparência pós-leilão.
 * 
 * Gap 1.3 - Histórico de Lances Anonimizado
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================================
// Types
// ============================================================================

interface AnonymizedBid {
  id: string;
  amount: number;
  timestamp: Date;
  bidderDisplay: string;
  isWinning: boolean;
  bidNumber: number;
}

interface BidHistoryResponse {
  lotId: string;
  totalBids: number;
  uniqueBidders: number;
  highestBid: number;
  lowestBid: number;
  averageBid: number;
  bidSpread: number;
  bids: AnonymizedBid[];
  trends: {
    totalIncrease: number;
    averageIncrement: number;
    peakBiddingTime?: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function anonymizeBidder(userId: string, _index: number): string {
  // Generate a consistent anonymous name based on user ID hash
  const hash = userId.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const animals = [
    "Leão", "Águia", "Tigre", "Lobo", "Urso", "Raposa", "Falcão", "Coruja",
    "Pantera", "Gavião", "Jaguar", "Serpente", "Tubarão", "Elefante", "Rinoceronte"
  ];

  const colors = [
    "Azul", "Vermelho", "Verde", "Dourado", "Prateado", "Bronze", "Roxo", "Laranja"
  ];

  const animalIndex = Math.abs(hash) % animals.length;
  const colorIndex = Math.abs(hash >> 4) % colors.length;

  return `${animals[animalIndex]} ${colors[colorIndex]}`;
}

function calculateTrends(bids: { amount: number; createdAt: Date }[]) {
  if (bids.length < 2) {
    return {
      totalIncrease: 0,
      averageIncrement: 0,
    };
  }

  const sortedBids = [...bids].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const firstBid = sortedBids[0].amount;
  const lastBid = sortedBids[sortedBids.length - 1].amount;
  const totalIncrease = lastBid - firstBid;

  let totalIncrement = 0;
  for (let i = 1; i < sortedBids.length; i++) {
    totalIncrement += sortedBids[i].amount - sortedBids[i - 1].amount;
  }
  const averageIncrement = totalIncrement / (sortedBids.length - 1);

  // Find peak bidding hour
  const hourCounts: Record<number, number> = {};
  for (const bid of bids) {
    const hour = new Date(bid.createdAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  const peakBiddingTime = peakHour ? `${peakHour[0]}:00 - ${parseInt(peakHour[0]) + 1}:00` : undefined;

  return {
    totalIncrease: Math.round(totalIncrease * 100) / 100,
    averageIncrement: Math.round(averageIncrement * 100) / 100,
    peakBiddingTime,
  };
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { lotId: string } }
) {
  try {
    const { lotId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const includeAll = searchParams.get("all") === "true";

    // Fetch lot to verify it exists and check status
    const lot = await prisma.lot.findUnique({
      where: { id: BigInt(lotId) },
      select: {
        id: true,
        status: true,
        currentBid: true,
        auction: {
          select: {
            status: true,
            endDate: true,
          },
        },
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
    }

    // Check if auction has ended (only show history after auction ends)
    const auctionEnded = 
      lot.auction?.status === "ENCERRADO" || 
      lot.status === "VENDIDO" ||
      lot.status === "NAO_VENDIDO" ||
      (lot.auction?.endDate && new Date(lot.auction.endDate) < new Date());

    if (!auctionEnded && !includeAll) {
      return NextResponse.json(
        { 
          error: "Histórico de lances disponível apenas após encerramento do leilão",
          message: "Bid history is only available after auction ends"
        },
        { status: 403 }
      );
    }

    // Fetch bids
    const bids = await prisma.bid.findMany({
      where: { lotId: BigInt(lotId) },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        userId: true,
      },
      orderBy: { createdAt: "desc" },
      take: includeAll ? undefined : limit,
    });

    if (bids.length === 0) {
      return NextResponse.json({
        lotId,
        totalBids: 0,
        uniqueBidders: 0,
        highestBid: 0,
        lowestBid: 0,
        averageBid: 0,
        bidSpread: 0,
        bids: [],
        trends: {
          totalIncrease: 0,
          averageIncrement: 0,
        },
      });
    }

    // Track unique bidders for consistent anonymization
    const bidderMap = new Map<string, string>();
    let bidderCounter = 0;

    // Process bids
    const amounts = bids.map((b: { amount: unknown }) => Number(b.amount));
    const highestBid = Math.max(...amounts);
    const lowestBid = Math.min(...amounts);
    const averageBid = amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;
    const uniqueBidderIds = new Set(bids.map((b: { userId: bigint }) => b.userId.toString()));

    // Anonymize bids
    const anonymizedBids: AnonymizedBid[] = bids.map((bid: { id: bigint; amount: unknown; createdAt: Date; userId: bigint }, index: number) => {
      const userKey = bid.userId.toString();
      if (!bidderMap.has(userKey)) {
        bidderMap.set(userKey, anonymizeBidder(userKey, bidderCounter++));
      }

      return {
        id: bid.id.toString(),
        amount: Number(bid.amount),
        timestamp: bid.createdAt,
        bidderDisplay: bidderMap.get(userKey)!,
        isWinning: Number(bid.amount) === highestBid,
        bidNumber: bids.length - index,
      };
    });

    // Calculate trends
    const trends = calculateTrends(
      bids.map((b: { amount: unknown; createdAt: Date }) => ({ amount: Number(b.amount), createdAt: b.createdAt }))
    );

    const response: BidHistoryResponse = {
      lotId,
      totalBids: bids.length,
      uniqueBidders: uniqueBidderIds.size,
      highestBid: Math.round(highestBid * 100) / 100,
      lowestBid: Math.round(lowestBid * 100) / 100,
      averageBid: Math.round(averageBid * 100) / 100,
      bidSpread: Math.round((highestBid - lowestBid) * 100) / 100,
      bids: anonymizedBids,
      trends,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao buscar histórico de lances:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
