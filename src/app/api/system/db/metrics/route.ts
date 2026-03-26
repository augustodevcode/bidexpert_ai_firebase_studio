/**
 * @file src/app/api/system/db/metrics/route.ts
 * @description Returns database metrics (count of tenants, users, auctions, lots, bids).
 * This route is force-dynamic to prevent static generation at build time,
 * which would fail without DATABASE_URL configured.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering - prevents build-time static generation
// This is required because the route accesses the database
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const [tenants, users, auctions, lots, bids] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.auction.count(),
      prisma.lot.count(),
      prisma.bid.count(),
    ]);

    return NextResponse.json({
      tenants,
      users,
      auctions,
      lots,
      bids,
    });
  } catch (error) {
    console.error('[api/system/db/metrics] Failed to load metrics', error);
    return NextResponse.json({
      tenants: 0,
      users: 0,
      auctions: 0,
      lots: 0,
      bids: 0,
    });
  }
}
