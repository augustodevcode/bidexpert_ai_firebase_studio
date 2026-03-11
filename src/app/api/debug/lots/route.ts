/**
 * @file Temporary diagnostic endpoint for lots query debugging
 * @description Tests the EXACT same queries used by Home V2 segment-data.ts
 * TODO: Remove after debugging is complete
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { insensitiveContains, getDatabaseType } from '@/lib/prisma/query-helpers';

export const dynamic = 'force-dynamic';

function safeSerialize(obj: unknown): unknown {
  return JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? v.toString() :
    v instanceof Date ? v.toISOString() :
    typeof v === 'object' && v !== null && v.constructor?.name === 'Decimal' ? Number(v) :
    v
  ));
}

export async function GET() {
  const results: Record<string, unknown> = {
    databaseType: getDatabaseType(),
    timestamp: new Date().toISOString(),
  };

  const patterns = ['veículo', 'veiculo', 'veículos', 'veiculos', 'carro', 'moto', 'caminhão', 'caminhao', 'ônibus', 'onibus', 'automóvel', 'automovel'];

  // Step 1: Test the EXACT Prisma query from getSegmentLots (with include)
  try {
    const lots = await prisma.lot.findMany({
      where: {
        status: { in: ['ABERTO_PARA_LANCES', 'EM_BREVE'] },
        OR: patterns.flatMap(pattern => [
          { title: insensitiveContains(pattern) },
          { LotCategory: { name: insensitiveContains(pattern) } },
          { type: insensitiveContains(pattern) },
        ]),
      },
      include: {
        LotCategory: true,
        Auction: {
          include: {
            Seller: true,
            Auctioneer: true,
            AuctionStage: true,
          }
        },
        LotStagePrice: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { endDate: 'asc' },
      ],
      take: 4,
    });
    results.step1_querySuccess = true;
    results.step1_lotsCount = lots.length;
    results.step1_lotIds = lots.map(l => Number(l.id));
    results.step1_lotTitles = lots.map(l => l.title);
    results.step1_hasAuction = lots.map(l => !!l.Auction);
    results.step1_hasCategory = lots.map(l => !!l.LotCategory);
    results.step1_hasPrices = lots.map(l => (l.LotStagePrice || []).length);
    results.step1_hasAuctionSeller = lots.map(l => !!l.Auction?.Seller);
    results.step1_hasAuctionStage = lots.map(l => (l.Auction?.AuctionStage || []).length);

    // Step 2: Test the transform (same as getSegmentLots)
    try {
      const transformed = lots.map(lot => ({
        ...lot,
        id: lot.id.toString(),
        auctionId: lot.auctionId.toString(),
        categoryId: lot.categoryId?.toString() || null,
        subcategoryId: (lot as any).subcategoryId?.toString() || null,
        sellerId: lot.sellerId?.toString() || null,
        auctioneerId: lot.auctioneerId?.toString() || null,
        cityId: lot.cityId?.toString() || null,
        stateId: lot.stateId?.toString() || null,
        winnerId: lot.winnerId?.toString() || null,
        originalLotId: (lot as any).originalLotId?.toString() || null,
        inheritedMediaFromAssetId: (lot as any).inheritedMediaFromAssetId?.toString() || null,
        tenantId: lot.tenantId.toString(),
        price: Number(lot.price),
        initialPrice: lot.initialPrice ? Number(lot.initialPrice) : null,
        secondInitialPrice: (lot as any).secondInitialPrice ? Number((lot as any).secondInitialPrice) : null,
        bidIncrementStep: lot.bidIncrementStep ? Number(lot.bidIncrementStep) : null,
        evaluationValue: (lot as any).evaluationValue ? Number((lot as any).evaluationValue) : null,
        categoryName: lot.LotCategory?.name || undefined,
        sellerName: lot.Auction?.Seller?.name || lot.Auction?.Auctioneer?.name || undefined,
        auctionName: lot.Auction?.title || undefined,
        auction: lot.Auction ? {
          ...lot.Auction,
          id: lot.Auction.id.toString(),
          tenantId: lot.Auction.tenantId.toString(),
        } : undefined,
        lotPrices: lot.LotStagePrice?.map((lsp: any) => ({
          ...lsp,
          id: lsp.id.toString(),
          lotId: lsp.lotId.toString(),
          price: Number(lsp.price),
        })) || [],
      }));
      results.step2_transformSuccess = true;
      results.step2_count = transformed.length;

      // Step 3: Test JSON serialization (what RSC would do)
      try {
        const serialized = JSON.stringify(transformed, (_, v) =>
          typeof v === 'bigint' ? v.toString() :
          typeof v === 'object' && v !== null && v.constructor?.name === 'Decimal' ? Number(v) :
          v
        );
        results.step3_serializeSuccess = true;
        results.step3_serializedSize = serialized.length;
      } catch (serErr: any) {
        results.step3_serializeError = serErr.message;
        results.step3_serializeStack = serErr.stack?.substring(0, 500);
      }

      // Step 4: Test native JSON.stringify (what RSC ACTUALLY uses - no BigInt handler)
      try {
        JSON.stringify(transformed);
        results.step4_nativeSerializeSuccess = true;
      } catch (natErr: any) {
        results.step4_nativeSerializeError = natErr.message;
        // Find which fields still have BigInt
        const bigIntFields: string[] = [];
        if (transformed.length > 0) {
          const first = transformed[0];
          for (const [key, val] of Object.entries(first)) {
            if (typeof val === 'bigint') bigIntFields.push(`lot.${key}`);
            if (typeof val === 'object' && val !== null) {
              for (const [k2, v2] of Object.entries(val)) {
                if (typeof v2 === 'bigint') bigIntFields.push(`lot.${key}.${k2}`);
                if (typeof v2 === 'object' && v2 !== null) {
                  for (const [k3, v3] of Object.entries(v2)) {
                    if (typeof v3 === 'bigint') bigIntFields.push(`lot.${key}.${k2}.${k3}`);
                  }
                }
              }
            }
          }
        }
        results.step4_bigIntFields = bigIntFields;
      }
    } catch (transformErr: any) {
      results.step2_transformError = transformErr.message;
      results.step2_transformStack = transformErr.stack?.substring(0, 500);
    }
  } catch (queryErr: any) {
    results.step1_queryError = queryErr.message;
    results.step1_queryStack = queryErr.stack?.substring(0, 500);
  }

  return NextResponse.json(safeSerialize(results), { status: 200 });
}
