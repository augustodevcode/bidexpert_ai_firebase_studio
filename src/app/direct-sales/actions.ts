/**
 * @fileoverview Server Actions for public-facing "Direct Sale" pages.
 * Provides functions to fetch direct sale offers for display in catalogs and detail pages.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { DirectSaleOffer } from '@/types';

/**
 * Fetches all direct sale offers, including related category and seller names.
 * This action is suitable for displaying a public catalog of all available offers.
 * @returns {Promise<DirectSaleOffer[]>} A promise that resolves to an array of DirectSaleOffer objects.
 */
export async function getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
  try {
    const offers = await prisma.directSaleOffer.findMany({
      include: {
        category: true,
        seller: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    // Map to a friendlier format for the frontend, including resolved names.
    return offers.map(o => ({
      ...o,
      category: o.category.name,
      sellerName: o.seller.name,
    })) as unknown as DirectSaleOffer[];
  } catch (error) {
    console.error("[Action - getDirectSaleOffers] Error fetching direct sale offers:", error);
    return [];
  }
}

/**
 * Fetches a single direct sale offer by its unique ID or public ID.
 * This is used for rendering the offer detail page.
 * @param {string} id - The unique identifier (internal ID or publicId) of the offer.
 * @returns {Promise<DirectSaleOffer | null>} A promise resolving to the offer object, or null if not found.
 */
export async function getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
    if (!id) return null;
    try {
        const offer = await prisma.directSaleOffer.findFirst({
            where: { OR: [{ id }, { publicId: id }] },
            include: { category: true, seller: true }
        });
        if (!offer) return null;
        return {
            ...offer,
            category: offer.category.name,
            sellerName: offer.seller.name,
        } as unknown as DirectSaleOffer;
    } catch (error) {
        console.error(`[Action - getDirectSaleOffer] Error fetching offer ${id}:`, error);
        return null;
    }
}
