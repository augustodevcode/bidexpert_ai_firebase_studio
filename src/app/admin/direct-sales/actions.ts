
// src/app/admin/direct-sales/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { DirectSaleOffer, DirectSaleOfferFormData } from '@/types';
import { v4 as uuidv4 } from 'uuid';

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

export async function getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
  try {
    const offers = await prisma.directSaleOffer.findMany({
        include: {
            category: true,
            seller: true
        }
    });
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

export async function getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
  try {
    const offer = await prisma.directSaleOffer.findUnique({
      where: { id },
      include: { category: true, seller: true }
    });
    if (!offer) return null;
    return { ...offer, category: offer.category.name, sellerName: offer.seller.name } as unknown as DirectSaleOffer;
  } catch (error) {
    console.error(`Error fetching offer ${id}:`, error);
    return null;
  }
}

export async function getDirectSaleOffersForSeller(sellerId: string): Promise<DirectSaleOffer[]> {
  try {
    const offers = await prisma.directSaleOffer.findMany({
        where: { sellerId },
        include: { category: true }
    });
     return offers.map(o => ({ ...o, category: o.category.name })) as unknown as DirectSaleOffer[];
  } catch (error) {
    console.error(`Error fetching direct sale offers for seller ${sellerId}:`, error);
    return [];
  }
}

export async function updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }> {
  try {
    await prisma.directSaleOffer.update({
      where: { id },
      data: {
        ...data,
      },
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
    return { success: false, message: 'Falha ao excluir oferta.' };
  }
}
