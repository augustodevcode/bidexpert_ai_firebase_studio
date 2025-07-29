// src/app/admin/direct-sales/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { DirectSaleOffer, DirectSaleOfferFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { slugify } from '@/lib/ui-helpers';

export async function getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    const offers = await prisma.directSaleOffer.findMany({ 
        orderBy: { createdAt: 'desc' },
        include: {
            seller: { select: { name: true, logoUrl: true, dataAiHintLogo: true } },
            category: { select: { name: true }}
        }
    });
    // Map to include denormalized fields for easier display
    return offers.map(offer => ({
        ...offer,
        sellerName: offer.seller?.name || 'N/A',
        sellerLogoUrl: offer.seller?.logoUrl,
        dataAiHintSellerLogo: offer.seller?.dataAiHintLogo,
        category: offer.category?.name || 'N/A' // Assuming category relation exists and is named as such
    })) as DirectSaleOffer[];
}

export async function getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
    const offer = await prisma.directSaleOffer.findFirst({ 
        where: { OR: [{ id }, { publicId: id }] },
        include: {
            seller: true,
            category: true
        }
    });
     if (!offer) return null;
    return {
        ...offer,
        sellerName: offer.seller?.name || 'N/A',
        category: offer.category?.name || 'N/A'
    } as DirectSaleOffer;
}

export async function createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean, message: string, offerId?: string }> {
  try {
    const dataToCreate: any = {
      ...data,
      publicId: `DSO-${uuidv4()}`,
      slug: slugify(data.title)
    };
    
    // Connect relations
    if (data.sellerId) {
        dataToCreate.seller = { connect: { id: data.sellerId } };
    }
     if (data.categoryId) {
        dataToCreate.category = { connect: { id: data.categoryId } };
    }
    
    delete dataToCreate.sellerId;
    delete dataToCreate.categoryId;
    
    const newOffer = await prisma.directSaleOffer.create({ data: dataToCreate });
    revalidatePath('/admin/direct-sales');
    return { success: true, message: "Oferta criada com sucesso.", offerId: newOffer.id };
  } catch (error: any) {
    return { success: false, message: `Falha ao criar oferta: ${error.message}` };
  }
}

export async function updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean, message: string }> {
  try {
    const dataToUpdate: any = { ...data };
    if (data.title) dataToUpdate.slug = slugify(data.title);

    // Connect relations
    if (data.sellerId) {
        dataToUpdate.seller = { connect: { id: data.sellerId } };
    }
    if (data.categoryId) {
        dataToUpdate.category = { connect: { id: data.categoryId } };
    }
    
    delete dataToUpdate.sellerId;
    delete dataToUpdate.categoryId;

    await prisma.directSaleOffer.update({ where: { id }, data: dataToUpdate });
    revalidatePath('/admin/direct-sales');
    revalidatePath(`/admin/direct-sales/${id}/edit`);
    return { success: true, message: "Oferta atualizada com sucesso." };
  } catch (error: any) {
    return { success: false, message: `Falha ao atualizar oferta: ${error.message}` };
  }
}

export async function deleteDirectSaleOffer(id: string): Promise<{ success: boolean, message: string }> {
  try {
    await prisma.directSaleOffer.delete({ where: { id } });
    revalidatePath('/admin/direct-sales');
    return { success: true, message: "Oferta excluída com sucesso." };
  } catch (error: any) {
    return { success: false, message: `Falha ao excluir oferta: ${error.message}` };
  }
}
