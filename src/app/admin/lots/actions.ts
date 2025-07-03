


'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Lot, LotFormData, LotDbData, Bem } from '@/types';
import type { LotFromModalValues } from '@/components/admin/lotting/create-lot-modal'; // Import new type
import { slugify } from '@/lib/sample-data-helpers';

// The main update action that calls the adapter
export async function updateLot(
  idOrPublicId: string,
  data: Partial<LotFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();

  // Basic conversion for data that needs it, though for 'title' it's a simple pass-through.
  // This is where more complex logic would go if needed (e.g., resolving category name to ID).
  const dataForDb: Partial<LotDbData> = {
    ...data,
  };

  const result = await db.updateLot(idOrPublicId, dataForDb);

  if (result.success) {
    revalidatePath('/admin/lots');
    revalidatePath(`/admin/lots/${idOrPublicId}/edit`);
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
  }
  return result;
}

export async function createLotWithBens(
  lotData: LotFromModalValues,
  bemIds: string[],
  auctionId: string,
  sellerName?: string | null,
  sellerId?: string | null,
  auctionName?: string
): Promise<{ success: boolean; message: string; lot?: Lot }> {
    const db = await getDatabaseAdapter();

    // Mark bens as LOTEADO
    const updateBensResult = await db.updateBensStatus(bemIds, 'LOTEADO');
    if (!updateBensResult.success) {
        return { success: false, message: `Falha ao atualizar status dos bens: ${updateBensResult.message}` };
    }

    const firstBem = await db.getBem(bemIds[0]);

    // Create the lot with bemIds
    const dataForDb: LotDbData = {
        ...lotData,
        auctionId,
        bemIds,
        sellerId: sellerId || undefined,
        sellerName: sellerName || undefined,
        auctionName,
        status: 'EM_BREVE',
        categoryId: firstBem?.categoryId,
        subcategoryId: firstBem?.subcategoryId,
        stateId: firstBem?.locationState, // This assumes state name is the ID, needs adjustment for real DB
        cityId: firstBem?.locationCity,
        price: lotData.initialPrice || 0,
    };

    const result = await db.createLot(dataForDb);

    if (result.success && result.lotId) {
        revalidatePath('/admin/lots');
        revalidatePath('/admin/bens');
        revalidatePath('/admin/lotting');
        revalidatePath(`/admin/auctions/${auctionId}/edit`);
        const newLot = await db.getLot(result.lotId);
        return { success: true, message: 'Lote criado com sucesso!', lot: newLot || undefined };
    } else {
        // Rollback bem status if lot creation fails
        await db.updateBensStatus(bemIds, 'DISPONIVEL');
        return { success: false, message: result.message };
    }
}


export async function createIndividualLotsAction(
    bemIds: string[],
    auctionId: string,
    auctionName?: string
): Promise<{ success: boolean; message: string; createdLots?: Lot[] }> {
    const db = await getDatabaseAdapter();
    const lotsToCreate: LotDbData[] = [];
    const bensToUpdate: string[] = [];
    const createdLotsResult: Lot[] = [];

    const auctionData = await db.getAuction(auctionId);
    if (!auctionData) {
        return { success: false, message: `Leilão com ID ${auctionId} não encontrado.` };
    }

    for (const bemId of bemIds) {
        const bem = await db.getBem(bemId);
        if (!bem || bem.status !== 'DISPONIVEL') {
            console.warn(`Bem ${bemId} não encontrado ou não disponível, pulando.`);
            continue;
        }

        lotsToCreate.push({
            title: bem.title,
            number: '', // O Adapter deve gerar o próximo número sequencial
            auctionId: auctionId,
            bemIds: [bem.id],
            price: bem.evaluationValue || 0,
            initialPrice: bem.evaluationValue || 0,
            status: 'EM_BREVE',
            categoryId: bem.categoryId,
            subcategoryId: bem.subcategoryId,
            sellerId: auctionData.sellerId,
            sellerName: auctionData.seller,
        });
        bensToUpdate.push(bem.id);
    }

    if (lotsToCreate.length === 0) {
        return { success: false, message: 'Nenhum bem válido para criar lotes.' };
    }

    const result = await db.createLotsFromBens(lotsToCreate);
    if (result.success) {
        await db.updateBensStatus(bensToUpdate, 'LOTEADO');
        revalidatePath('/admin/lotting');
        revalidatePath(`/admin/auctions/${auctionId}/edit`);
    }

    return result;
}



export async function updateLotTitle(
  idOrPublicId: string,
  newTitle: string
): Promise<{ success: boolean; message: string }> {
  if (!newTitle || newTitle.trim().length < 5) {
    return { success: false, message: "Título deve ter pelo menos 5 caracteres." };
  }

  // Call the main update action, which correctly uses the adapter
  const result = await updateLot(idOrPublicId, { title: newTitle });

  if (result.success) {
    // Revalidate paths to ensure UI updates across the app
    const lot = await getLot(idOrPublicId); // Re-fetch to get auctionId for path revalidation
    if (lot) {
      revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
      revalidatePath(`/auctions/${lot.auctionId}`);
    }
    revalidatePath('/search');
    revalidatePath('/');
  }

  return result;
}

export async function updateLotImage(
  lotIdOrPublicId: string,
  mediaItemId: string,
  imageUrl: string
): Promise<{ success: boolean; message: string }> {
  const result = await updateLot(lotIdOrPublicId, { imageMediaId: mediaItemId, imageUrl: imageUrl });
  if (result.success) {
    revalidatePath('/search');
    revalidatePath('/');
    revalidatePath('/dashboard/favorites');
  }
  return result;
}


// --- Other Lot Actions ---

export async function createLot(
  data: LotFormData
): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> {
  const db = await getDatabaseAdapter();
  // The adapter handles converting form data to DB data
  const result = await db.createLot(data);
  if (result.success) {
    revalidatePath('/admin/lots');
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
  }
  return result;
}

export async function getLots(auctionIdParam?: string): Promise<Lot[]> {
  const db = await getDatabaseAdapter();
  return db.getLots(auctionIdParam);
}

export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  if (!ids || ids.length === 0) return [];
  const db = await getDatabaseAdapter();
  return db.getLotsByIds(ids);
}

export async function getLot(idOrPublicId: string): Promise<Lot | null> {
  const db = await getDatabaseAdapter();
  return db.getLot(idOrPublicId);
}

export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  const db = await getDatabaseAdapter();
  return db.getBensByIds(ids);
}

export async function updateLotFeaturedStatus(
  idOrPublicId: string,
  newStatus: boolean
): Promise<{ success: boolean; message: string }> {
  const result = await updateLot(idOrPublicId, { isFeatured: newStatus });
  if (result.success) {
    revalidatePath('/'); // Revalidate homepage for featured lots section
    revalidatePath(`/auctions/${idOrPublicId}`); // Assuming a direct lot page might exist
    revalidatePath('/search');
  }
  return { success: result.success, message: `Destaque do lote atualizado!` };
}

export async function deleteLot(
  idOrPublicId: string,
  auctionId?: string
): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const lot = await db.getLot(idOrPublicId);

  // Rollback bem status if lot is deleted
  if(lot && lot.bemIds && lot.bemIds.length > 0) {
    await db.updateBensStatus(lot.bemIds, 'DISPONIVEL');
  }

  const result = await db.deleteLot(idOrPublicId, auctionId);
  if (result.success) {
    revalidatePath('/admin/lots');
    revalidatePath('/admin/bens');
    revalidatePath('/admin/lotting');
    if (auctionId) {
      revalidatePath(`/admin/auctions/${auctionId}/edit`);
    }
  }
  return result;
}
