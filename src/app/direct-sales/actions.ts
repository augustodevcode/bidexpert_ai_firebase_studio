
'use server';

import { prisma } from '@/lib/prisma';
import type { DirectSaleOffer } from '@/types';

export async function getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
  try {
    const offers = await prisma.directSaleOffer.findMany({
      include: {
        category: true,
        seller: true,
      },
      orderBy: { createdAt: 'desc' }
    });
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
