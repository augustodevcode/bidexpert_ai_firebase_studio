// src/app/admin/lots/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { Lot, Bem } from '@/types';
import { revalidatePath } from 'next/cache';
import { fetchLots, fetchLot, fetchBensByIds, fetchLotsByIds } from '@/lib/data-queries';

export async function getLots(auctionId?: string): Promise<Lot[]> {
  return fetchLots(auctionId);
}

export async function getLot(id: string): Promise<Lot | null> {
  return fetchLot(id);
}

export async function createLot(data: Partial<Lot>): Promise<{ success: boolean, message: string, lotId?: string }> {
  try {
    const lotDataForCreation = {
      ...data,
      id: undefined, // Let prisma generate it
      publicId: undefined,
      bens: data.bemIds ? { connect: data.bemIds.map(id => ({ id })) } : undefined,
    }

    // @ts-ignore - Prisma will handle the relations
    delete lotDataForCreation.bemIds;

    const newLot = await prisma.lot.create({
      // @ts-ignore
      data: lotDataForCreation,
    });
    revalidatePath('/admin/lots');
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
    return { success: true, message: 'Lote criado com sucesso!', lotId: newLot.id };
  } catch (error: any) {
    console.error("Error creating lot:", error);
    return { success: false, message: `Falha ao criar lote: ${error.message}` };
  }
}

export async function updateLot(id: string, data: Partial<Lot>): Promise<{ success: boolean, message: string }> {
  try {
    const lot = await prisma.lot.findFirst({ where: { OR: [{id: id}, {publicId: id}]}});
    if (!lot) return { success: false, message: 'Lote não encontrado.'};

    const updateData = {
      ...data,
      bens: data.bemIds ? { set: data.bemIds.map(id => ({ id })) } : undefined,
    }
    // @ts-ignore
    delete updateData.bemIds;

    // @ts-ignore
    await prisma.lot.update({
      where: { id: lot.id },
      data: updateData,
    });
    
    revalidatePath('/admin/lots');
    revalidatePath(`/admin/lots/${id}/edit`);
    if (lot?.auctionId) {
      revalidatePath(`/admin/auctions/${lot.auctionId}/edit`);
    }
    return { success: true, message: 'Lote atualizado com sucesso!' };
  } catch(error: any) {
    console.error(`Error updating lot ${id}:`, error);
    return { success: false, message: `Falha ao atualizar lote: ${error.message}` };
  }
}

export async function deleteLot(id: string, auctionId?: string): Promise<{ success: boolean, message: string }> {
  try {
    const lotToDelete = await prisma.lot.findFirst({ where: { OR: [{id: id}, {publicId: id}] }});
    if (!lotToDelete) {
        return { success: false, message: "Lote não encontrado." };
    }
    const finalAuctionId = auctionId || lotToDelete.auctionId;

    await prisma.lot.delete({ where: { id: lotToDelete.id } });

    revalidatePath('/admin/lots');
    if (finalAuctionId) {
      revalidatePath(`/admin/auctions/${finalAuctionId}/edit`);
    }
    return { success: true, message: 'Lote excluído com sucesso.' };
  } catch (error: any) {
    console.error(`Error deleting lot ${id}:`, error);
    return { success: false, message: 'Falha ao excluir lote.' };
  }
}


// These functions are helpers and might need to be adjusted based on adapter capabilities
export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
  return fetchBensByIds(ids);
}

export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  return fetchLotsByIds(ids);
}

export async function finalizeLot(lotId: string): Promise<{ success: boolean; message: string }> {
  console.log(`[Action] Finalizing lot ${lotId} - not implemented for this adapter.`);
  // This requires significant logic: finding highest bid, creating UserWin, notifications...
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
