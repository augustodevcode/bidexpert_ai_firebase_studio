

'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Lot, LotFormData, LotDbData, Bem } from '@/types';
import type { LotFromModalValues } from '@/components/admin/lotting/create-lot-modal'; // Import new type

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
  sellerId?: string,
  auctionName?: string,
  sellerName?: string,
  initialStatus?: Lot['status']
): Promise<{ success: boolean; message: string; lotId?: string }> {
    const db = await getDatabaseAdapter();

    // 1. Mark bens as LOTEADO
    const updateBensResult = await db.updateBensStatus(bemIds, 'LOTEADO');
    if (!updateBensResult.success) {
        return { success: false, message: `Falha ao atualizar status dos bens: ${updateBensResult.message}` };
    }

    // 2. Create the lot with bemIds
    const dataForDb: LotDbData = {
        ...lotData,
        auctionId,
        bemIds,
        sellerId,
        sellerName,
        auctionName,
        status: initialStatus || 'EM_BREVE', // Set status based on auction or default
    };

    const result = await db.createLot(dataForDb);

    if (result.success) {
        revalidatePath('/admin/lots');
        revalidatePath('/admin/bens');
        revalidatePath('/admin/lotting');
        revalidatePath(`/admin/auctions/${auctionId}/edit`);
    } else {
        // Rollback bem status if lot creation fails
        await db.updateBensStatus(bemIds, 'DISPONIVEL');
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
