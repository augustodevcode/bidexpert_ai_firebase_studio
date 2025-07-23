// src/app/admin/lots/actions.ts
'use server';

import type { Lot, Bem, LotFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function getLots(auctionId?: string): Promise<Lot[]> {
  const lots = await prisma.lot.findMany({
    where: auctionId ? { auctionId } : {},
    include: {
        bens: true,
        auction: { select: { title: true } }
    },
    orderBy: { number: 'asc' }
  });
  // @ts-ignore
  return lots.map(lot => ({ ...lot, auctionName: lot.auction?.title }));
}

export async function getLot(id: string): Promise<Lot | null> {
  return prisma.lot.findFirst({
    where: { OR: [{ id }, { publicId: id }] },
    include: { bens: true, auction: true }
  });
}

export async function createLot(data: Partial<LotFormData>): Promise<{ success: boolean, message: string, lotId?: string }> {
  try {
    const { bemIds, ...lotData } = data;
    const result = await prisma.lot.create({
      // @ts-ignore
      data: {
        ...lotData,
        bens: bemIds ? { connect: bemIds.map(id => ({ id })) } : undefined,
      },
    });
    revalidatePath('/admin/lots');
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
    return { success: true, message: 'Lote criado com sucesso!', lotId: result.id };
  } catch (error: any) {
    return { success: false, message: `Falha ao criar lote: ${error.message}` };
  }
}

export async function updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean, message: string }> {
  try {
    const { bemIds, ...lotData } = data;
    const lot = await prisma.lot.update({
      where: { id },
      // @ts-ignore
      data: {
        ...lotData,
        bens: bemIds ? { set: bemIds.map(id => ({ id })) } : undefined,
      }
    });
    revalidatePath('/admin/lots');
    revalidatePath(`/admin/lots/${id}/edit`);
    if (lot?.auctionId) {
      revalidatePath(`/admin/auctions/${lot.auctionId}/edit`);
    }
    return { success: true, message: 'Lote atualizado com sucesso.' };
  } catch (error: any) {
    return { success: false, message: `Falha ao atualizar lote: ${error.message}` };
  }
}

export async function deleteLot(id: string, auctionId?: string): Promise<{ success: boolean, message: string }> {
  try {
    const lotToDelete = await prisma.lot.findFirst({ where: { OR: [{id}, {publicId: id}]}});
    if (!lotToDelete) throw new Error("Lote não encontrado.");

    const finalAuctionId = auctionId || lotToDelete?.auctionId;

    await prisma.lot.delete({ where: { id: lotToDelete.id } });
    revalidatePath('/admin/lots');
    if (finalAuctionId) {
      revalidatePath(`/admin/auctions/${finalAuctionId}/edit`);
    }
    return { success: true, message: 'Lote excluído com sucesso.' };
  } catch (error: any) {
    return { success: false, message: `Falha ao excluir lote: ${error.message}` };
  }
}

export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
  return prisma.bem.findMany({ where: { id: { in: ids } } });
}

export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  if (ids.length === 0) return [];
  return prisma.lot.findMany({ where: { id: { in: ids } } });
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
