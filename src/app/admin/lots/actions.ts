// src/app/admin/lots/actions.ts
'use server';

import type { Lot, Bem, LotFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { LotService } from '@/services/lot.service';
import { BemRepository } from '@/repositories/bem.repository'; // Usar repositório diretamente aqui é aceitável por ser uma query simples

const lotService = new LotService();
const bemRepository = new BemRepository(); // Instanciar para buscar bens

export async function getLots(auctionId?: string): Promise<Lot[]> {
  return lotService.getLots(auctionId);
}

export async function getLot(id: string): Promise<Lot | null> {
  return lotService.getLotById(id);
}

export async function createLot(data: Partial<LotFormData>): Promise<{ success: boolean, message: string, lotId?: string }> {
  const result = await lotService.createLot(data);
  if (result.success) {
    revalidatePath('/admin/lots');
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
  }
  return result;
}

export async function updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean, message: string }> {
  const result = await lotService.updateLot(id, data);
  if (result.success) {
      revalidatePath('/admin/lots');
      revalidatePath(`/admin/lots/${id}/edit`);
      if (data.auctionId) {
        revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
      }
  }
  return result;
}

export async function deleteLot(id: string, auctionId?: string): Promise<{ success: boolean, message: string }> {
  const lotToDelete = await lotService.getLotById(id);
  const finalAuctionId = auctionId || lotToDelete?.auctionId;

  const result = await lotService.deleteLot(id);
  
  if (result.success) {
    revalidatePath('/admin/lots');
    if (finalAuctionId) {
      revalidatePath(`/admin/auctions/${finalAuctionId}/edit`);
    }
  }
  return result;
}

export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
  return bemRepository.findByIds(ids);
}

export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  if (ids.length === 0) return [];
  // This is also likely better in the LotService/Repository
  const { prisma } = await import('@/lib/prisma');
  // @ts-ignore
  return prisma.lot.findMany({ where: { id: { in: ids } }, include: { auction: true } });
}

export async function finalizeLot(lotId: string): Promise<{ success: boolean; message: string }> {
  console.log(`[Action] Finalizing lot ${lotId} - not implemented for this adapter.`);
  return { success: false, message: "Finalização de lote não implementada." };
}

export async function updateLotFeaturedStatus(id: string, isFeatured: boolean): Promise<{ success: boolean, message: string }> {
  return updateLot(id, { isFeatured });
}

export async function updateLotTitle(id: string, title: string): Promise<{ success: boolean, message: string }> {
  return updateLot(id, { title });
}

export async function updateLotImage(id: string, mediaItemId: string, imageUrl: string): Promise<{ success: boolean, message: string }> {
  return updateLot(id, { imageMediaId: mediaItemId, imageUrl });
}
