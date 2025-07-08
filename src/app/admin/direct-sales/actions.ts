/**
 * @fileoverview Server Actions for managing Direct Sale Offers from the admin panel.
 * Provides CRUD (Create, Read, Update, Delete) functionalities for DirectSaleOffer entities
 * using Prisma ORM for database interactions.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { DirectSaleOffer, DirectSaleOfferFormData } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new Direct Sale Offer.
 * Resolves category and seller names to their corresponding IDs before creation.
 * @param {DirectSaleOfferFormData} data - The form data for the new offer.
 * @returns {Promise<{ success: boolean; message: string; offerId?: string; }>} Result of the operation.
 */
export async function createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean; message: string; offerId?: string; }> {
  try {
    const category = await prisma.lotCategory.findFirst({ where: { name: data.category }});
    if (!category) return { success: false, message: 'Categoria não encontrada.' };

    const seller = await prisma.seller.findFirst({ where: { name: data.sellerName }});
    if (!seller) return { success: false, message: 'Vendedor não encontrado.' };

    const newOffer = await prisma.directSaleOffer.create({
      data: {
        publicId: `DSO-PUB-${uuidv4().substring(0, 8)}`,
        title: data.title,
        description: data.description,
        offerType: data.offerType,
        status: data.status,
        price: data.price,
        minimumOfferPrice: data.minimumOfferPrice,
        locationCity: data.locationCity,
        locationState: data.locationState,
        imageUrl: data.imageUrl,
        imageMediaId: data.imageMediaId,
        dataAiHint: data.dataAiHint,
        expiresAt: data.expiresAt,
        categoryId: category.id,
        sellerId: seller.id,
      },
    });

    revalidatePath('/admin/direct-sales');
    revalidatePath('/direct-sales');
    revalidatePath('/consignor-dashboard/direct-sales');
    revalidatePath('/consignor-dashboard/overview');
    return { success: true, message: 'Oferta criada com sucesso!', offerId: newOffer.id };
  } catch (error: any) {
    console.error("Error creating DirectSaleOffer:", error);
    return { success: false, message: 'Falha ao criar oferta.' };
  }
}

/**
 * Fetches all Direct Sale Offers with their related category and seller info.
 * @returns {Promise<DirectSaleOffer[]>} An array of all direct sale offers.
 */
export async function getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
  try {
    const offers = await prisma.directSaleOffer.findMany({
        include: {
            category: true,
            seller: true
        },
        orderBy: { createdAt: 'desc' }
    });
    // Map to the composite type that includes names for easier frontend use.
    return offers.map(o => ({
        ...o,
        category: o.category.name,
        sellerName: o.seller.name,
    })) as unknown as DirectSaleOffer[];
  } catch (error) {
    console.error("Error fetching direct sale offers:", error);
    return [];
  }
}

/**
 * Fetches a single Direct Sale Offer by its internal or public ID.
 * @param {string} id - The internal or public ID of the offer.
 * @returns {Promise<DirectSaleOffer | null>} The offer object or null if not found.
 */
export async function getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
  try {
    const offer = await prisma.directSaleOffer.findFirst({
      where: { OR: [{ id }, { publicId: id }] },
      include: { category: true, seller: true }
    });
    if (!offer) return null;
    return { ...offer, category: offer.category.name, sellerName: offer.seller.name } as unknown as DirectSaleOffer;
  } catch (error) {
    console.error(`Error fetching offer ${id}:`, error);
    return null;
  }
}

/**
 * Updates an existing Direct Sale Offer.
 * @param {string} id - The ID of the offer to update.
 * @param {Partial<DirectSaleOfferFormData>} data - The data to update.
 * @returns {Promise<{ success: boolean; message: string; }>} Result of the operation.
 */
export async function updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }> {
  try {
    await prisma.directSaleOffer.update({
      where: { id },
      data: data as any, // Using 'any' to bypass strict checks on partial JSON data
    });
    revalidatePath('/admin/direct-sales');
    revalidatePath(`/admin/direct-sales/${id}/edit`);
    revalidatePath(`/direct-sales/${id}`);
    revalidatePath('/direct-sales');
    revalidatePath('/consignor-dashboard/direct-sales');
    revalidatePath('/consignor-dashboard/overview');
    return { success: true, message: 'Oferta atualizada com sucesso!' };
  } catch (error: any) {
    console.error(`Error updating offer ${id}:`, error);
    return { success: false, message: 'Falha ao atualizar oferta.' };
  }
}

/**
 * Deletes a Direct Sale Offer from the database.
 * @param {string} id - The ID of the offer to delete.
 * @returns {Promise<{ success: boolean; message: string; }>} Result of the operation.
 */
export async function deleteDirectSaleOffer(id: string): Promise<{ success: boolean; message: string; }> {
  try {
    await prisma.directSaleOffer.delete({ where: { id } });
    revalidatePath('/admin/direct-sales');
    revalidatePath('/direct-sales');
    revalidatePath('/consignor-dashboard/direct-sales');
    revalidatePath('/consignor-dashboard/overview');
    return { success: true, message: 'Oferta excluída com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting offer ${id}:`, error);
    // Prisma's P2003 code indicates a foreign key constraint violation.
    if (error.code === 'P2003') {
        return { success: false, message: 'Não é possível excluir. Esta oferta pode ter propostas ou outros dados vinculados.' };
    }
    return { success: false, message: 'Falha ao excluir oferta.' };
  }
}
