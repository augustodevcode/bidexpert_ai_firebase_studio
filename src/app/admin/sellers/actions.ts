// src/app/admin/sellers/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { SellerProfileInfo, SellerFormData, Lot } from '@/types';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/sample-data-helpers';


export async function getSellers(): Promise<SellerProfileInfo[]> {
    const sellers = await prisma.seller.findMany({ orderBy: { name: 'asc' }});
    return sellers as unknown as SellerProfileInfo[];
}

export async function getSeller(id: string): Promise<SellerProfileInfo | null> {
    const seller = await prisma.seller.findFirst({
        where: { OR: [{ id }, { publicId: id }] }
    });
    return seller as unknown as SellerProfileInfo | null;
}

export async function getSellerBySlug(slugOrId: string): Promise<SellerProfileInfo | null> {
    const seller = await prisma.seller.findFirst({
        where: { OR: [{ slug: slugOrId }, { publicId: slugOrId }, { id: slugOrId }] }
    });
    return seller as unknown as SellerProfileInfo | null;
}

export async function getLotsBySellerSlug(sellerSlugOrId: string): Promise<Lot[]> {
  const seller = await getSellerBySlug(sellerSlugOrId);
  if (!seller) return [];

  const lots = await prisma.lot.findMany({
    where: { sellerId: seller.id }
  });
  return lots as unknown as Lot[];
}


export async function createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    try {
        const newSeller = await prisma.seller.create({
            data: {
                ...data,
                slug: slugify(data.name),
            }
        });
        revalidatePath('/admin/sellers');
        return { success: true, message: 'Comitente criado com sucesso!', sellerId: newSeller.id };
    } catch (error: any) {
        console.error("Error creating seller:", error);
        return { success: false, message: `Falha ao criar comitente: ${error.message}` };
    }
}

export async function updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
    try {
        const updateData: any = {...data};
        if (data.name) {
            updateData.slug = slugify(data.name);
        }
        await prisma.seller.update({
            where: { id },
            data: updateData,
        });
        revalidatePath('/admin/sellers');
        revalidatePath(`/admin/sellers/${id}/edit`);
        return { success: true, message: 'Comitente atualizado com sucesso!' };
    } catch (error: any) {
        console.error(`Error updating seller ${id}:`, error);
        return { success: false, message: `Falha ao atualizar comitente: ${error.message}` };
    }
}

export async function deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
    try {
        // Here you would add checks for related entities before deleting
        await prisma.seller.delete({ where: { id } });
        revalidatePath('/admin/sellers');
        return { success: true, message: 'Comitente excluído com sucesso.' };
    } catch (error: any) {
        console.error(`Error deleting seller ${id}:`, error);
        return { success: false, message: 'Falha ao excluir comitente.' };
    }
}
