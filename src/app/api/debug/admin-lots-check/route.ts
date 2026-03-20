/**
 * @fileoverview Diagnostic endpoint to identify why admin lots return empty.
 * Tests the exact same Prisma query and mapping used by admin getLots action.
 * This endpoint maps each lot individually to identify which lot(s) fail mapping.
 * 
 * TEMPORARY — DELETE after diagnosis.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    steps: {} as Record<string, unknown>,
  };

  try {
    // Step 1: Count total lots in tenant 1
    const totalCount = await prisma.lot.count({ where: { tenantId: BigInt(1) } });
    (diagnostics.steps as Record<string, unknown>).totalLotsInTenant1 = totalCount;

    // Step 2: Run the exact same query as admin getLots (with full include chain)
    let rawLots: unknown[];
    try {
      rawLots = await prisma.lot.findMany({
        where: { tenantId: BigInt(1) },
        include: {
          Auction: {
            include: {
              AuctionStage: { orderBy: { id: 'asc' } }
            }
          },
          JudicialProcess: true,
          LotStagePrice: true,
          AssetsOnLots: {
            include: {
              Asset: {
                include: {
                  AssetMedia: {
                    include: { MediaItem: true },
                    orderBy: { displayOrder: 'asc' }
                  }
                }
              }
            }
          },
          CoverImage: true,
          LotRisk: true,
          LotDocument: {
            orderBy: { displayOrder: 'asc' }
          },
          _count: {
            select: { Bid: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      (diagnostics.steps as Record<string, unknown>).querySuccess = true;
      (diagnostics.steps as Record<string, unknown>).rawLotsCount = rawLots.length;
    } catch (queryError: unknown) {
      const err = queryError as Error;
      (diagnostics.steps as Record<string, unknown>).querySuccess = false;
      (diagnostics.steps as Record<string, unknown>).queryError = {
        message: err.message,
        name: err.name,
        stack: err.stack?.split('\n').slice(0, 5),
      };
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Step 3: Try mapping each lot individually to find which ones fail
    const mappingResults: { id: string; success: boolean; error?: string; status?: string; auctionId?: string }[] = [];
    
    for (const rawLot of rawLots) {
      const lot = rawLot as Record<string, unknown>;
      const lotId = String(lot.id);
      try {
        // Replicate the critical parts of mapLotWithDetails
        const mapped: Record<string, unknown> = {};
        mapped.id = (lot.id as bigint).toString();
        mapped.auctionId = (lot.auctionId as bigint).toString(); // Could fail if null
        mapped.tenantId = (lot.tenantId as bigint).toString();
        mapped.categoryId = (lot.categoryId as bigint | null)?.toString();
        mapped.subcategoryId = (lot.subcategoryId as bigint | null)?.toString();
        mapped.sellerId = (lot.sellerId as bigint | null)?.toString();
        mapped.auctioneerId = (lot.auctioneerId as bigint | null)?.toString();
        mapped.cityId = (lot.cityId as bigint | null)?.toString();
        mapped.stateId = (lot.stateId as bigint | null)?.toString();
        mapped.winnerId = (lot.winnerId as bigint | null)?.toString();
        mapped.originalLotId = (lot.originalLotId as bigint | null)?.toString();
        mapped.inheritedMediaFromAssetId = (lot.inheritedMediaFromAssetId as bigint | null)?.toString();
        mapped.price = Number(lot.price);
        mapped.status = lot.status;

        // Test auction mapping
        const lotAuction = lot.Auction as Record<string, unknown> | null;
        if (lotAuction) {
          mapped.auctionMappedId = (lotAuction.id as bigint).toString();
          mapped.auctionTenantId = (lotAuction.tenantId as bigint).toString();
          const stages = (lotAuction.AuctionStage ?? []) as Record<string, unknown>[];
          mapped.stagesCount = stages.length;
          stages.forEach((s) => {
            // These could fail
            String(s.id);
            String(s.auctionId);
          });
        }

        // Test lotPrices mapping
        const lotPrices = (lot.LotStagePrice ?? []) as Record<string, unknown>[];
        mapped.pricesCount = lotPrices.length;
        lotPrices.forEach((lp) => {
          String(lp.id);
          String(lp.lotId);
          String(lp.auctionStageId); // Could fail if null
          Number(lp.initialBid);
        });

        // Test judicialProcesses mapping
        const jps = (lot.JudicialProcess ?? []) as Record<string, unknown>[];
        mapped.jpCount = jps.length;
        jps.forEach((jp) => {
          String(jp.id);
          String(jp.tenantId);
        });

        // Test assetsOnLots mapping
        const assetsOnLots = (lot.AssetsOnLots ?? []) as Record<string, unknown>[];
        mapped.assetsCount = assetsOnLots.length;
        assetsOnLots.forEach((a) => {
          const assetObj = (a as Record<string, unknown>).Asset as Record<string, unknown> | null;
          if (assetObj) {
            String(assetObj.id);
            String(assetObj.tenantId);
          }
        });

        // Test documents mapping
        const docs = (lot.LotDocument ?? []) as Record<string, unknown>[];
        mapped.docsCount = docs.length;
        docs.forEach((d) => {
          String(d.id);
          String(d.lotId);
          String(d.tenantId);
        });

        // Test lotRisks mapping
        const risks = (lot.LotRisk ?? []) as Record<string, unknown>[];
        mapped.risksCount = risks.length;
        risks.forEach((r) => {
          String(r.id);
          String(r.lotId);
          String(r.tenantId);
        });

        mappingResults.push({
          id: lotId,
          success: true,
          status: String(lot.status),
          auctionId: String(lot.auctionId),
        });
      } catch (mapError: unknown) {
        const err = mapError as Error;
        mappingResults.push({
          id: lotId,
          success: false,
          error: `${err.name}: ${err.message}`,
          status: String(lot.status),
          auctionId: String(lot.auctionId),
        });
      }
    }

    const failures = mappingResults.filter(r => !r.success);
    (diagnostics.steps as Record<string, unknown>).totalMapped = mappingResults.length;
    (diagnostics.steps as Record<string, unknown>).successCount = mappingResults.length - failures.length;
    (diagnostics.steps as Record<string, unknown>).failureCount = failures.length;
    (diagnostics.steps as Record<string, unknown>).failures = failures;

    // Step 4: Also test sanitizeResponse on a successful lot
    if (mappingResults.some(r => r.success)) {
      try {
        const { sanitizeResponse } = await import('@/lib/serialization-helper');
        const testData = { bigIntField: BigInt(123), decimalField: 45.67, dateField: new Date() };
        const sanitized = sanitizeResponse(testData);
        (diagnostics.steps as Record<string, unknown>).sanitizeTest = { success: true, result: sanitized };
      } catch (sanitizeError: unknown) {
        const err = sanitizeError as Error;
        (diagnostics.steps as Record<string, unknown>).sanitizeTest = { success: false, error: err.message };
      }
    }

    // Step 5: Test the actual action code path
    try {
      const { getTenantIdFromRequest } = await import('@/lib/actions/auth');
      const tenantId = await getTenantIdFromRequest(false);
      (diagnostics.steps as Record<string, unknown>).getTenantIdResult = tenantId;
    } catch (tenantError: unknown) {
      const err = tenantError as Error;
      (diagnostics.steps as Record<string, unknown>).getTenantIdError = {
        message: err.message,
        name: err.name,
      };
    }

    diagnostics.conclusion = failures.length > 0
      ? `FOUND ${failures.length} lots that fail mapping — this is likely the root cause!`
      : 'All lots map successfully — the error may be in getTenantIdFromRequest or sanitizeResponse';

    return NextResponse.json(diagnostics);
  } catch (outerError: unknown) {
    const err = outerError as Error;
    diagnostics.outerError = {
      message: err.message,
      name: err.name,
      stack: err.stack?.split('\n').slice(0, 10),
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
