
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { Lot, LotFormData, LotDbData, Bem, Auction } from '@/types';
import { v4 as uuidv4 } from 'uuid';

async function recalculateLotCount(auctionId: string) {
  try {
    const lotCount = await prisma.lot.count({ where: { auctionId } });
    await prisma.auction.update({
      where: { id: auctionId },
      data: { totalLots: lotCount },
    });
  } catch (error) {
    console.error(`Failed to recalculate lot count for auction ${auctionId}:`, error);
  }
}

export async function createLot(data: LotFormData): Promise<{
  success: boolean;
  message: string;
  lotId?: string;
  lotPublicId?: string;
}> {
  try {
    const lotDataForDb = {
      ...data,
      publicId: `LOT-PUB-${uuidv4().substring(0, 8)}`,
      price: data.price,
      initialPrice: data.initialPrice,
      secondInitialPrice: data.secondInitialPrice,
      categoryId: data.type, // 'type' from form is categoryId
      subcategoryId: data.subcategoryId,
      stateId: data.stateId,
      cityId: data.cityId,
      bemIds: data.bemIds,
      mediaItemIds: data.mediaItemIds,
      status: 'EM_BREVE'
    };
    
    // Remove fields that are not in the Lot model
    const { type, auctionName, ...restOfData } = lotDataForDb;

    const newLot = await prisma.lot.create({
      data: restOfData,
    });
    
    if (newLot.auctionId) {
        await recalculateLotCount(newLot.auctionId);
    }

    revalidatePath('/admin/lots');
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
    return { success: true, message: 'Lote criado com sucesso!', lotId: newLot.id, lotPublicId: newLot.publicId };
  } catch (error: any) {
    console.error("Error creating lot with Prisma:", error);
    return { success: false, message: `Falha ao criar lote: ${error.message}` };
  }
}

export async function getLots(auctionIdParam?: string): Promise<Lot[]> {
  try {
    const lots = await prisma.lot.findMany({
      where: auctionIdParam ? { auctionId: auctionIdParam } : {},
      include: {
        auction: { select: { title: true } },
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
      },
      orderBy: { number: 'asc' },
    });

    return lots.map(lot => ({
      ...lot,
      type: lot.category?.name,
      auctionName: lot.auction?.title,
      subcategoryName: lot.subcategory?.name,
    })) as unknown as Lot[];
  } catch (error) {
    console.error("Error fetching lots with Prisma:", error);
    return [];
  }
}

export async function getLot(idOrPublicId: string): Promise<Lot | null> {
  try {
    const lot = await prisma.lot.findFirst({
      where: { OR: [{ id: idOrPublicId }, { publicId: idOrPublicId }] },
      include: {
        auction: true,
        category: true,
        subcategory: true,
      }
    });

    if (!lot) return null;

    return {
      ...lot,
      type: lot.category?.name,
      auctionName: lot.auction?.title,
      subcategoryName: lot.subcategory?.name,
    } as unknown as Lot;
  } catch (error) {
    console.error(`Error fetching lot ${idOrPublicId} with Prisma:`, error);
    return null;
  }
}


export async function updateLot(idOrPublicId: string, data: Partial<LotFormData>): Promise<{ success: boolean; message: string; }> {
    try {
        const lot = await getLot(idOrPublicId);
        if (!lot) return { success: false, message: "Lote não encontrado." };

        const { type, auctionName, ...restOfData } = data;
        const dataForDb: any = { ...restOfData };
        if (type) dataForDb.categoryId = type; // 'type' in form is 'categoryId' in db

        await prisma.lot.update({
            where: { id: lot.id },
            data: dataForDb,
        });

        revalidatePath('/admin/lots');
        revalidatePath(`/admin/lots/${idOrPublicId}/edit`);
        if (lot.auctionId) {
            revalidatePath(`/admin/auctions/${lot.auctionId}/edit`);
        }
        return { success: true, message: 'Lote atualizado com sucesso!' };
    } catch (error: any) {
        console.error("Error updating lot with Prisma:", error);
        return { success: false, message: `Falha ao atualizar lote: ${error.message}` };
    }
}

export async function deleteLot(idOrPublicId: string, auctionId?: string): Promise<{ success: boolean; message: string; }> {
    try {
        const lot = await getLot(idOrPublicId);
        if (!lot) return { success: false, message: "Lote não encontrado." };

        await prisma.lot.delete({ where: { id: lot.id } });

        const finalAuctionId = auctionId || lot.auctionId;
        if (finalAuctionId) {
            await recalculateLotCount(finalAuctionId);
            revalidatePath(`/admin/auctions/${finalAuctionId}/edit`);
        }
        revalidatePath('/admin/lots');
        revalidatePath('/admin/bens');
        return { success: true, message: 'Lote excluído com sucesso.' };
    } catch (error: any) {
        console.error("Error deleting lot:", error);
        if (error.code === 'P2003') {
            return { success: false, message: 'Não é possível excluir. Este lote tem lances ou outros dados associados.' };
        }
        return { success: false, message: `Falha ao excluir lote: ${error.message}` };
    }
}


export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  const bens = await prisma.bem.findMany({ where: { id: { in: ids } } });
  return bens as unknown as Bem[];
}

export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  if (!ids || ids.length === 0) return [];
  const lots = await prisma.lot.findMany({ where: { id: { in: ids } } });
  return lots as unknown as Lot[];
}

export async function updateLotFeaturedStatus(idOrPublicId: string, newStatus: boolean): Promise<{ success: boolean; message: string; }> {
  const result = await updateLot(idOrPublicId, { isFeatured: newStatus });
  if (result.success) {
    revalidatePath('/');
    revalidatePath(`/auctions/${idOrPublicId}`);
    revalidatePath('/search');
  }
  return { success: result.success, message: `Destaque do lote atualizado!` };
}

export async function updateLotTitle(idOrPublicId: string, newTitle: string): Promise<{ success: boolean; message: string; }> {
  if (!newTitle || newTitle.trim().length < 5) return { success: false, message: "Título deve ter pelo menos 5 caracteres." };
  return updateLot(idOrPublicId, { title: newTitle });
}

export async function updateLotImage(lotIdOrPublicId: string, mediaItemId: string, imageUrl: string): Promise<{ success: boolean; message: string; }> {
  return updateLot(lotIdOrPublicId, { imageMediaId: mediaItemId, imageUrl: imageUrl });
}
