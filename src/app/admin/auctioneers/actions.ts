
'use server';

import { revalidatePath } from 'next/cache';
import { sampleAuctioneers, slugify } from '@/lib/sample-data';
import type { AuctioneerProfileInfo, AuctioneerFormData } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function createAuctioneer(
  data: AuctioneerFormData
): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> {
  console.log(`[Action - createAuctioneer - SampleData Mode] Simulating creation for: ${data.name}`);
  await delay(100);
  revalidatePath('/admin/auctioneers');
  return { success: true, message: `Leiloeiro "${data.name}" (simulado) criado!`, auctioneerId: `sample-auct-${Date.now()}`, auctioneerPublicId: `AUCT-PUB-SAMP-${Date.now()}` };
}

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  console.log('[Action - getAuctioneers - SampleData Mode] Fetching from sample-data.ts');
  await delay(50);
  return Promise.resolve(JSON.parse(JSON.stringify(sampleAuctioneers)));
}

export async function getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
  console.log(`[Action - getAuctioneer - SampleData Mode] Fetching ID/slug/publicId: ${id}`);
  await delay(50);
  const auctioneer = sampleAuctioneers.find(auc => auc.id === id || auc.slug === id || auc.publicId === id);
  return Promise.resolve(auctioneer ? JSON.parse(JSON.stringify(auctioneer)) : null);
}

export async function getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
  console.log(`[Action - getAuctioneerBySlug - SampleData Mode] Fetching slug/publicId: ${slugOrPublicId}`);
  await delay(50);
  const auctioneer = sampleAuctioneers.find(auc => auc.slug === slugOrPublicId || auc.publicId === slugOrPublicId);
  return Promise.resolve(auctioneer ? JSON.parse(JSON.stringify(auctioneer)) : null);
}

export async function getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> {
  console.log(`[Action - getAuctioneerByName - SampleData Mode] Fetching name: ${name}`);
  await delay(50);
  const normalizedName = name.trim().toLowerCase();
  const auctioneer = sampleAuctioneers.find(auc => auc.name.toLowerCase() === normalizedName);
  return Promise.resolve(auctioneer ? JSON.parse(JSON.stringify(auctioneer)) : null);
}

export async function updateAuctioneer(
  idOrPublicId: string, 
  data: Partial<AuctioneerFormData>
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - updateAuctioneer - SampleData Mode] Simulating update for ID/publicId: ${idOrPublicId} with data:`, data);
  await delay(100);
  revalidatePath('/admin/auctioneers');
  revalidatePath(`/admin/auctioneers/${idOrPublicId}/edit`);
  const auctioneer = await getAuctioneer(idOrPublicId); // Uses the sample data version
  if (auctioneer?.slug) {
    revalidatePath(`/auctioneers/${auctioneer.slug}`);
  }
  return { success: true, message: `Leiloeiro (simulado) atualizado!` };
}

export async function deleteAuctioneer(
  idOrPublicId: string 
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - deleteAuctioneer - SampleData Mode] Simulating deletion for ID/publicId: ${idOrPublicId}`);
  await delay(100);
  const auctioneerToDelete = await getAuctioneer(idOrPublicId); // Uses the sample data version
  revalidatePath('/admin/auctioneers');
  if (auctioneerToDelete?.slug) {
    revalidatePath(`/auctioneers/${auctioneerToDelete.slug}`);
  }
  return { success: true, message: `Leiloeiro (simulado) excluído!` };
}
    