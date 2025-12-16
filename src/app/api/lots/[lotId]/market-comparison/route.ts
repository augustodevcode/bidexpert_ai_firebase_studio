/**
 * @file src/app/api/lots/[lotId]/market-comparison/route.ts
 * @description API route para comparação com preços de mercado.
 * Retorna indicadores de mercado e comparáveis para o lote.
 * 
 * Gap 1.4 - Indicadores de Mercado
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================================
// Types
// ============================================================================

interface ComparableItem {
  id: string;
  title: string;
  price: number;
  source: "interno" | "mercado";
  similarity: number;
  date: Date;
  location?: string;
}

interface MarketComparisonResponse {
  lotId: string;
  lotTitle: string;
  evaluationValue: number;
  currentBid: number;
  marketIndicators: {
    averageMarketPrice: number;
    medianMarketPrice: number;
    priceRange: { min: number; max: number };
    discountFromMarket: number;
    pricePerUnit?: number;
    marketTrend: "rising" | "stable" | "falling";
  };
  comparables: ComparableItem[];
  pricePositioning: {
    position: "below" | "at" | "above";
    percentile: number;
    recommendation: string;
  };
  lastUpdated: Date;
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateMarketTrend(prices: number[]): "rising" | "stable" | "falling" {
  if (prices.length < 3) return "stable";

  const recentAvg = prices.slice(0, Math.ceil(prices.length / 3)).reduce((a, b) => a + b, 0) / Math.ceil(prices.length / 3);
  const olderAvg = prices.slice(-Math.ceil(prices.length / 3)).reduce((a, b) => a + b, 0) / Math.ceil(prices.length / 3);

  const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

  if (changePercent > 5) return "rising";
  if (changePercent < -5) return "falling";
  return "stable";
}

function getRecommendation(position: "below" | "at" | "above", discount: number): string {
  if (position === "below") {
    if (discount > 30) {
      return "Excelente oportunidade! Preço significativamente abaixo do mercado.";
    }
    if (discount > 15) {
      return "Boa oportunidade. Preço abaixo da média de mercado.";
    }
    return "Preço levemente abaixo do mercado. Considere outros fatores.";
  }
  if (position === "at") {
    return "Preço alinhado com o mercado. Avalie condição e documentação.";
  }
  return "Preço acima do mercado. Verifique diferenciais que justifiquem.";
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

    // Fetch lot with details
    const lot = await prisma.lot.findUnique({
      where: { id: BigInt(lotId) },
      include: {
        auction: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
    }

    // Fetch similar lots for comparison (same category, recent)
    const categoryId = lot.auction?.categoryId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90);

    const similarLots = await prisma.lot.findMany({
      where: {
        id: { not: BigInt(lotId) },
        auction: {
          categoryId: categoryId || undefined,
          endDate: { gte: thirtyDaysAgo },
        },
        OR: [
          { status: "VENDIDO" },
          { status: "NAO_VENDIDO" },
          { status: "ENCERRADO" },
        ],
      },
      select: {
        id: true,
        title: true,
        currentBid: true,
        evaluationValue: true,
        createdAt: true,
        auction: {
          select: {
            city: true,
            state: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Calculate market metrics
    const prices = similarLots
      .map((l: { currentBid: unknown; evaluationValue: unknown }) => Number(l.currentBid || l.evaluationValue || 0))
      .filter((p: number) => p > 0)
      .sort((a: number, b: number) => a - b);

    const evaluationValue = Number(lot.evaluationValue || 0);
    const currentBid = Number(lot.currentBid || lot.initialPrice || 0);

    let averageMarketPrice = 0;
    let medianMarketPrice = 0;
    let priceRange = { min: 0, max: 0 };
    let discountFromMarket = 0;
    let percentile = 50;

    if (prices.length > 0) {
      averageMarketPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      medianMarketPrice = prices[Math.floor(prices.length / 2)];
      priceRange = { min: prices[0], max: prices[prices.length - 1] };
      
      if (averageMarketPrice > 0) {
        discountFromMarket = ((averageMarketPrice - currentBid) / averageMarketPrice) * 100;
      }

      // Calculate percentile position
      const lowerCount = prices.filter((p: number) => p < currentBid).length;
      percentile = (lowerCount / prices.length) * 100;
    }

    // Determine price positioning
    let position: "below" | "at" | "above" = "at";
    if (discountFromMarket > 10) position = "below";
    else if (discountFromMarket < -10) position = "above";

    // Build comparables list
    const comparables: ComparableItem[] = similarLots.slice(0, 10).map((l: { id: bigint; title: string | null; currentBid: unknown; evaluationValue: unknown; createdAt: Date; auction: { city: string | null; state: string | null } | null }, index: number) => ({
      id: l.id.toString(),
      title: l.title || `Lote similar #${index + 1}`,
      price: Number(l.currentBid || l.evaluationValue || 0),
      source: "interno" as const,
      similarity: Math.max(60, 95 - index * 5),
      date: l.createdAt,
      location: l.auction?.city && l.auction?.state 
        ? `${l.auction.city}, ${l.auction.state}`
        : undefined,
    }));

    const response: MarketComparisonResponse = {
      lotId,
      lotTitle: lot.title || "Lote sem título",
      evaluationValue: Math.round(evaluationValue * 100) / 100,
      currentBid: Math.round(currentBid * 100) / 100,
      marketIndicators: {
        averageMarketPrice: Math.round(averageMarketPrice * 100) / 100,
        medianMarketPrice: Math.round(medianMarketPrice * 100) / 100,
        priceRange: {
          min: Math.round(priceRange.min * 100) / 100,
          max: Math.round(priceRange.max * 100) / 100,
        },
        discountFromMarket: Math.round(discountFromMarket * 100) / 100,
        marketTrend: calculateMarketTrend(prices),
      },
      comparables,
      pricePositioning: {
        position,
        percentile: Math.round(percentile),
        recommendation: getRecommendation(position, discountFromMarket),
      },
      lastUpdated: new Date(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao buscar comparação de mercado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
