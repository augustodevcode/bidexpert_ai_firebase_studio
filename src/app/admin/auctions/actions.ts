
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Auction, AuctionFormData } from '@/types';
import { sampleAuctions } from '@/lib/sample-data'; // Keep for fallback if needed

export async function createAuction(
  data: AuctionFormData
): Promise<{ success: boolean; message: string; auctionId?: string }> {
  const db = getDatabaseAdapter();
  const result = await db.createAuction(data);
  if (result.success) {
    revalidatePath('/admin/auctions');
    revalidatePath('/consignor-dashboard/overview');
  }
  return result;
}

export async function getAuctions(): Promise<Auction[]> {
  const db = getDatabaseAdapter();
  const auctions = await db.getAuctions();
  if (auctions.length === 0 && process.env.ACTIVE_DATABASE_SYSTEM !== 'FIRESTORE') {
      // Fallback to sample data if SQL DB is empty (for development)
      // This can be removed or adjusted for production
      console.warn("[getAuctions] SQL DB returned no auctions, using sample data as fallback.");
      return sampleAuctions.map(auction => ({
        ...auction,
        auctionDate: new Date(auction.auctionDate as Date), 
        endDate: auction.endDate ? new Date(auction.endDate as Date) : null,
        auctionStages: auction.auctionStages?.map(stage => ({
            ...stage,
            endDate: new Date(stage.endDate as Date),
        })),
        createdAt: new Date(auction.createdAt || new Date()), 
        updatedAt: new Date(auction.updatedAt || new Date()), 
      }));
  }
  return auctions;
}

export async function getAuctionsBySellerSlug(sellerSlug: string): Promise<Auction[]> {
  const db = getDatabaseAdapter();
  return db.getAuctionsBySellerSlug(sellerSlug);
}

export async function getAuction(id: string): Promise<Auction | null> {
  const db = getDatabaseAdapter();
  const auction = await db.getAuction(id);
   if (!auction && process.env.ACTIVE_DATABASE_SYSTEM !== 'FIRESTORE') {
      const foundInSample = sampleAuctions.find(s_auction => s_auction.id === id);
      if (foundInSample) {
        console.warn(`[getAuction for ID ${id}] SQL DB returned null, found in sample data.`);
        return {
            ...foundInSample,
            auctionDate: new Date(foundInSample.auctionDate as Date),
            endDate: foundInSample.endDate ? new Date(foundInSample.endDate as Date) : null,
            auctionStages: foundInSample.auctionStages?.map(stage => ({
                ...stage,
                endDate: new Date(stage.endDate as Date),
            })),
            createdAt: new Date(foundInSample.createdAt || new Date()),
            updatedAt: new Date(foundInSample.updatedAt || new Date()),
        };
      }
    }
  return auction;
}

export async function updateAuction(
  id: string,
  data: Partial<AuctionFormData>
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.updateAuction(id, data);
  if (result.success) {
    revalidatePath('/admin/auctions');
    revalidatePath(`/admin/auctions/${id}/edit`);
    revalidatePath('/consignor-dashboard/overview');
  }
  return result;
}

export async function deleteAuction(
  id: string
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.deleteAuction(id);
  if (result.success) {
    revalidatePath('/admin/auctions');
    revalidatePath('/consignor-dashboard/overview');
  }
  return result;
}
