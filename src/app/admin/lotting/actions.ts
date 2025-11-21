'use server';

import { LottingService } from '@/services/lotting.service';
import type { LottingFilterState, LottingSnapshot } from '@/types/lotting';
import { getTenantIdFromRequest } from '@/lib/actions/auth';

const lottingService = new LottingService();

export async function getLottingSnapshotAction(filters?: LottingFilterState): Promise<LottingSnapshot> {
  const tenantId = await getTenantIdFromRequest();
  return lottingService.getSnapshot(tenantId, filters);
}
