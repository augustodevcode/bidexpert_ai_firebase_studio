
'use server';

import { revalidatePath } from 'next/cache';
import { sampleAuctions, sampleLots, slugify } from '@/lib/sample-data'; 
import type { Auction, AuctionFormData, AuctionDbData } from '@/types';
import { getLotCategoryByName } from '@/app/admin/categories/actions';
import { getAuctioneerByName } from '@/app/admin/auctioneers/actions'; 
import { getSellerByName } from '@/app/admin/sellers/actions';     

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function createAuction(
  data: AuctionFormData
): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }> {
  console.log(`[Action - createAuction - SampleData Mode] Simulating creation for: ${data.title}`);
  console.log(`[Action - createAuction - SampleData Mode] Data received:`, {
    ...data,
    automaticBiddingEnabled: data.automaticBiddingEnabled,
    allowInstallmentBids: data.allowInstallmentBids,
    estimatedRevenue: data.estimatedRevenue,
    isFeaturedOnMarketplace: data.isFeaturedOnMarketplace,
    marketplaceAnnouncementTitle: data.marketplaceAnnouncementTitle,
    auctionType: data.auctionType
  });
  await delay(100);
  revalidatePath('/admin/auctions');
  revalidatePath('/consignor-dashboard/overview');
  return { success: true, message: `Leilão "${data.title}" (simulado) criado!`, auctionId: `sample-auc-${Date.now()}`, auctionPublicId: `AUC-PUB-SAMP-${Date.now()}` };
}

export async function getAuctions(): Promise<Auction[]> {
  console.log('[Action - getAuctions - SampleData Mode] Fetching from sample-data.ts');
  await delay(50);
  const auctionsWithLots = sampleAuctions.map(auction => ({
    ...auction,
    lots: sampleLots.filter(lot => lot.auctionId === auction.id),
    totalLots: sampleLots.filter(lot => lot.auctionId === auction.id).length,
  }));
  return Promise.resolve(JSON.parse(JSON.stringify(auctionsWithLots)));
}

export async function getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
  console.log(`[Action - getAuctionsBySellerSlug - SampleData Mode] Fetching for slug: ${sellerSlugOrPublicId}`);
  await delay(50);
  const auctions = sampleAuctions.filter(auction => 
    (auction.seller && slugify(auction.seller) === sellerSlugOrPublicId) || auction.sellerId === sellerSlugOrPublicId
  ).map(auction => ({
    ...auction,
    lots: sampleLots.filter(lot => lot.auctionId === auction.id),
    totalLots: sampleLots.filter(lot => lot.auctionId === auction.id).length,
  }));
  return Promise.resolve(JSON.parse(JSON.stringify(auctions)));
}

export async function getAuction(idOrPublicId: string): Promise<Auction | null> {
  console.log(`[Action - getAuction - SampleData Mode] Fetching ID/publicId: ${idOrPublicId}`);
  await delay(50);
  const auction = sampleAuctions.find(a => a.id === idOrPublicId || a.publicId === idOrPublicId);
  if (auction) {
    const auctionWithLots = {
        ...auction,
        lots: sampleLots.filter(lot => lot.auctionId === auction.id),
        totalLots: sampleLots.filter(lot => lot.auctionId === auction.id).length,
    };
    return Promise.resolve(JSON.parse(JSON.stringify(auctionWithLots)));
  }
  return Promise.resolve(null);
}

export async function updateAuction(
  idOrPublicId: string,
  data: Partial<AuctionFormData>
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - updateAuction - SampleData Mode] Simulating update for ID/publicId: ${idOrPublicId}`);
   console.log(`[Action - updateAuction - SampleData Mode] Data received for update:`, {
    ...data,
    automaticBiddingEnabled: data.automaticBiddingEnabled,
    allowInstallmentBids: data.allowInstallmentBids,
    estimatedRevenue: data.estimatedRevenue,
    isFeaturedOnMarketplace: data.isFeaturedOnMarketplace,
    marketplaceAnnouncementTitle: data.marketplaceAnnouncementTitle,
    auctionType: data.auctionType
  });
  await delay(100);
  revalidatePath('/admin/auctions');
  revalidatePath(`/admin/auctions/${idOrPublicId}/edit`);
  revalidatePath('/consignor-dashboard/overview');
  return { success: true, message: `Leilão (simulado) atualizado!` };
}

export async function deleteAuction(
  idOrPublicId: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - deleteAuction - SampleData Mode] Simulating deletion for ID/publicId: ${idOrPublicId}`);
  await delay(100);
  revalidatePath('/admin/auctions');
  revalidatePath('/consignor-dashboard/overview');
  return { success: true, message: `Leilão (simulado) excluído!` };
}
    
