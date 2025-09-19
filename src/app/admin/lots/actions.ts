// src/app/admin/lots/actions.ts
'use server';

import type { Lot, Bem, LotFormData, UserWin } from '@/types';
import { revalidatePath } from 'next/cache';
import { LotService } from '@/services/lot.service';
import { BemRepository } from '@/repositories/bem.repository';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/app/auth/actions';

const lotService = new LotService();
const bemRepository = new BemRepository();

async function getTenantId(isPublicCall: boolean = false): Promise<string> {
    const session = await getSession();
    if (!session?.tenantId) {
        if (isPublicCall) {
            return '1';
        }
        throw new Error("Acesso não autorizado ou tenant não identificado.");
    }
    return session.tenantId;
}

export async function getLots(auctionId?: string, isPublicCall: boolean = false): Promise<Lot[]> {
  const tenantId = await getTenantId(isPublicCall);
  return lotService.getLots(auctionId, tenantId);
}

export async function getLot(id: string, isPublicCall: boolean = false): Promise<Lot | null> {
  const tenantId = isPublicCall ? undefined : await getTenantId();
  return lotService.getLotById(id, tenantId);
}

export async function createLot(data: Partial<LotFormData>): Promise<{ success: boolean, message: string, lotId?: string }> {
  const tenantId = await getTenantId();
  const result = await lotService.createLot(data, tenantId);
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

export async function getBensForLotting(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]> {
  const tenantId = await getTenantId();
  return bemRepository.findAll({ ...filter, tenantId });
}

export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
  return bemRepository.findByIds(ids);
}

export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  return lotService.getLotsByIds(ids);
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