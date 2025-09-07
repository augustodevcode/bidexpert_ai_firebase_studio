// src/app/admin/lots/actions.ts
'use server';

import type { Lot, Bem, LotFormData, UserWin } from '@/types';
import { revalidatePath } from 'next/cache';
import { LotService } from '@/services/lot.service';
import { BemService } from '@/services/bem.service'; // Use BemService
import { prisma } from '@/lib/prisma';
import { generateDocument } from '@/ai/flows/generate-document-flow';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const lotService = new LotService();
const bemService = new BemService(); // Instantiate BemService

export async function getLots(auctionId?: string): Promise<Lot[]> {
  return lotService.getLots(auctionId);
}

export async function getLot(id: string): Promise<Lot | null> {
  return lotService.getLotById(id);
}

export async function createLot(data: Partial<LotFormData>): Promise<{ success: boolean, message: string, lotId?: string }> {
  const result = await lotService.createLot(data);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/lots');
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
  }
  return result;
}

export async function updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean, message: string }> {
  const result = await lotService.updateLot(id, data);
  if (result.success && process.env.NODE_ENV !== 'test') {
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
  
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/lots');
    if (finalAuctionId) {
      revalidatePath(`/admin/auctions/${finalAuctionId}/edit`);
    }
  }
  return result;
}

export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
  return bemService.getBensByIds(ids); // Use the service method
}

export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  return lotService.getLotsByIds(ids); // Use the service method
}

export async function finalizeLot(lotId: string): Promise<{ success: boolean; message: string }> {
  const result = await lotService.finalizeLot(lotId);
  if (result.success && process.env.NODE_ENV !== 'test') {
    const lot = await lotService.getLotById(lotId);
    if(lot) {
      revalidatePath(`/admin/lots/${lotId}/edit`);
      revalidatePath(`/admin/auctions/${lot.auctionId}/edit`);
    }
  }
  return result;
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
