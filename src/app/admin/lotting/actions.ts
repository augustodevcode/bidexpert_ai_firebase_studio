'use server';

import { LottingService } from '@/services/lotting.service';
import type { LottingFilterState, LottingSnapshot } from '@/types/lotting';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { sanitizeResponse } from '@/lib/serialization-helper';

const lottingService = new LottingService();

export async function getLottingSnapshotAction(filters?: LottingFilterState): Promise<LottingSnapshot> {
  try {
    const tenantId = await getTenantIdFromRequest();
    const result = await lottingService.getSnapshot(tenantId, filters);
    return sanitizeResponse(result);
  } catch (error) {
    console.error('[getLottingSnapshotAction] Error:', error);
    return sanitizeResponse({ auctions: [], lots: [], assets: [], stats: { totalAuctions: 0, totalLots: 0, totalAssets: 0, lotsWithoutAuction: 0 } } as unknown as LottingSnapshot);
  }
}
