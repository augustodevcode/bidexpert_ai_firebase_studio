/**
 * @fileoverview Server actions for the Auction Lineage tab.
 * Fetches lineage graph data for a given auction with tenant isolation.
 */
'use server';

import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { getAuctionLineage } from '@/services/auction-lineage.service';
import type { AuctionLineageData } from '@/types/auction-lineage';

/**
 * Fetches the auction lineage data for ReactFlow visualization.
 * Serializes BigInt fields to numbers for client consumption.
 */
export async function fetchAuctionLineageAction(
  auctionId: number
): Promise<AuctionLineageData> {
  const tenantId = await getTenantIdFromRequest(false);

  if (!tenantId) {
    return {
      auctionId,
      auctionTitle: '',
      isJudicial: false,
      nodes: [],
      edges: [],
    };
  }

  const data = await getAuctionLineage(auctionId, Number(tenantId));

  // Serialize: ensure no BigInt in response (BigInt is not JSON-serializable)
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  ) as AuctionLineageData;
}
