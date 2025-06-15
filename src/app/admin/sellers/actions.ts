
'use server';

import { revalidatePath } from 'next/cache';
import { sampleSellers, slugify } from '@/lib/sample-data';
import type { SellerProfileInfo, SellerFormData } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function createSeller(
  data: SellerFormData
): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> {
  console.log(`[Action - createSeller - SampleData Mode] Simulating creation for: ${data.name}`);
  await delay(100);
  revalidatePath('/admin/sellers');
  return { success: true, message: `Comitente "${data.name}" (simulado) criado!`, sellerId: `sample-seller-${Date.now()}`, sellerPublicId: `SELL-PUB-SAMP-${Date.now()}` };
}

export async function getSellers(): Promise<SellerProfileInfo[]> {
  console.log('[Action - getSellers - SampleData Mode] Fetching from sample-data.ts');
  await delay(50);
  return Promise.resolve(JSON.parse(JSON.stringify(sampleSellers)));
}

export async function getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> {
  console.log(`[Action - getSeller - SampleData Mode] Fetching ID/slug/publicId: ${idOrPublicId}`);
  await delay(50);
  const seller = sampleSellers.find(s => s.id === idOrPublicId || s.slug === idOrPublicId || s.publicId === idOrPublicId);
  return Promise.resolve(seller ? JSON.parse(JSON.stringify(seller)) : null);
}

export async function getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null> {
  console.log(`[Action - getSellerBySlug - SampleData Mode] Fetching slug/publicId: ${slugOrPublicId}`);
  await delay(50);
  const seller = sampleSellers.find(s => s.slug === slugOrPublicId || s.publicId === slugOrPublicId);
  return Promise.resolve(seller ? JSON.parse(JSON.stringify(seller)) : null);
}

export async function getSellerByName(name: string): Promise<SellerProfileInfo | null> {
  console.log(`[Action - getSellerByName - SampleData Mode] Fetching name: ${name}`);
  await delay(50);
  const normalizedName = name.trim().toLowerCase();
  const seller = sampleSellers.find(sel => sel.name.toLowerCase() === normalizedName);
  return Promise.resolve(seller ? JSON.parse(JSON.stringify(seller)) : null);
}

export async function updateSeller(
  idOrPublicId: string,
  data: Partial<SellerFormData>
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - updateSeller - SampleData Mode] Simulating update for ID/publicId: ${idOrPublicId} with data:`, data);
  await delay(100);
  revalidatePath('/admin/sellers');
  revalidatePath(`/admin/sellers/${idOrPublicId}/edit`);
  revalidatePath(`/consignor-dashboard/overview`); 
  return { success: true, message: `Comitente (simulado) atualizado!` };
}

export async function deleteSeller(
  idOrPublicId: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - deleteSeller - SampleData Mode] Simulating deletion for ID/publicId: ${idOrPublicId}`);
  await delay(100);
  revalidatePath('/admin/sellers');
  return { success: true, message: `Comitente (simulado) excluído!` };
}
    