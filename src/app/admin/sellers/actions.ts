/**
 * @fileoverview Server Actions for managing Seller profiles.
 * 
 * This file contains the server-side logic for creating, reading, updating,
 * and deleting seller profiles (SellerProfileInfo). These functions
 * interact directly with the Prisma client to perform database operations
 * and revalidate Next.js cache where necessary to reflect changes in the UI.
 */
'use server';

import { revalidatePath } from 'next/cache';
import type { SellerProfileInfo, SellerFormData, Lot } from '@/types';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new seller profile in the database.
 * @param {SellerFormData} data - The seller data from the form.
 * @returns {Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }>} 
 * An object indicating the result of the operation.
 */
export async function createSeller(
  data: SellerFormData
): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> {
  try {
    const newSeller = await prisma.seller.create({
      data: {
        ...data,
        publicId: `SELL-PUB-${uuidv4().substring(0,8)}`,
        slug: slugify(data.name),
        userId: data.userId || null,
        judicialBranchId: data.judicialBranchId || null,
      }
    });
    revalidatePath('/admin/sellers');
    revalidatePath('/admin/wizard');
    return { success: true, message: 'Comitente criado com sucesso!', sellerId: newSeller.id, sellerPublicId: newSeller.publicId };
  } catch (error: any) {
    console.error("Error creating seller:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      return { success: false, message: 'Já existe um comitente com este nome (slug). Por favor, escolha outro nome.' };
    }
    return { success: false, message: error.message || 'Falha ao criar comitente.' };
  }
}

/**
 * Fetches all seller profiles from the database.
 * @returns {Promise<SellerProfileInfo[]>} An array of all sellers.
 */
export async function getSellers(): Promise<SellerProfileInfo[]> {
  try {
    const sellers = await prisma.seller.findMany({
      orderBy: { name: 'asc' },
      include: { judicialBranch: { select: { name: true, district: { select: { name: true }} } }}
    });
    
    return sellers.map(s => ({
      ...s,
      judicialBranchName: s.judicialBranch ? `${s.judicialBranch.name} - ${s.judicialBranch.district.name}` : undefined,
    })) as unknown as SellerProfileInfo[];

  } catch (error: any) {
    console.error("Error fetching sellers:", error);
    return [];
  }
}

/**
 * Fetches a single seller by their internal ID or public ID.
 * @param {string} idOrPublicId - The internal or public ID of the seller.
 * @returns {Promise<SellerProfileInfo | null>} The seller profile or null if not found.
 */
export async function getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> {
  try {
    const seller = await prisma.seller.findFirst({
      where: { OR: [{ id: idOrPublicId }, { publicId: idOrPublicId }] }
    });
    return seller as unknown as SellerProfileInfo | null;
  } catch (error: any) {
    console.error(`Error fetching seller with ID ${idOrPublicId}:`, error);
    return null;
  }
}

/**
 * Fetches a single seller by their slug or public ID.
 * @param {string} slugOrPublicId - The slug or public ID of the seller.
 * @returns {Promise<SellerProfileInfo | null>} The seller profile or null if not found.
 */
export async function getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null> {
  try {
    const seller = await prisma.seller.findFirst({
      where: { OR: [{ slug: slugOrPublicId }, { publicId: slugOrPublicId }] }
    });
    return seller as unknown as SellerProfileInfo | null;
  } catch (error: any) {
    console.error(`Error fetching seller by slug/publicId ${slugOrPublicId}:`, error);
    return null;
  }
}

/**
 * Fetches all lots associated with a specific seller.
 * @param {string} sellerSlugOrPublicId - The slug or public ID of the seller.
 * @returns {Promise<Lot[]>} An array of lots associated with the seller.
 */
export async function getLotsBySellerSlug(sellerSlugOrPublicId: string): Promise<Lot[]> {
  try {
    const lots = await prisma.lot.findMany({
      where: {
        auction: {
          seller: {
            OR: [
              { slug: sellerSlugOrPublicId },
              { publicId: sellerSlugOrPublicId }
            ]
          }
        }
      },
      include: {
        auction: true,
      }
    });
    return lots as unknown as Lot[];
  } catch (error) {
    console.error(`Error fetching lots for seller slug/id ${sellerSlugOrPublicId}:`, error);
    return [];
  }
}

/**
 * Fetches a single seller by their exact name.
 * @param {string} name - The name of the seller.
 * @returns {Promise<SellerProfileInfo | null>} The seller profile or null if not found.
 */
export async function getSellerByName(name: string): Promise<SellerProfileInfo | null> {
  try {
    const seller = await prisma.seller.findFirst({
      where: { name }
    });
    return seller as unknown as SellerProfileInfo | null;
  } catch (error: any) {
    console.error(`Error fetching seller by name ${name}:`, error);
    return null;
  }
}

/**
 * Updates an existing seller's profile.
 * @param {string} id - The internal ID of the seller to update.
 * @param {Partial<SellerFormData>} data - The partial data to update.
 * @returns {Promise<{ success: boolean; message: string; }>} An object indicating the result.
 */
export async function updateSeller(
  id: string,
  data: Partial<SellerFormData>
): Promise<{ success: boolean; message: string }> {
  try {
    const updateData: any = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name);
    }
    await prisma.seller.update({
      where: { id },
      data: updateData,
    });
    revalidatePath('/admin/sellers');
    revalidatePath(`/admin/sellers/${id}/edit`);
    if(updateData.slug) revalidatePath(`/sellers/${updateData.slug}`);
    return { success: true, message: 'Comitente atualizado com sucesso!' };
  } catch (error: any) {
    console.error(`Error updating seller with ID ${id}:`, error);
    return { success: false, message: error.message || 'Falha ao atualizar comitente.' };
  }
}

/**
 * Deletes a seller from the database.
 * @param {string} id - The internal ID of the seller to delete.
 * @returns {Promise<{ success: boolean; message: string; }>} An object indicating the result.
 */
export async function deleteSeller(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.seller.delete({ where: { id } });
    revalidatePath('/admin/sellers');
    return { success: true, message: 'Comitente excluído com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting seller with ID ${id}:`, error);
    if (error.code === 'P2003') { // Foreign key constraint failed
      return { success: false, message: 'Não é possível excluir. Este comitente está associado a um ou mais leilões/processos.' };
    }
    return { success: false, message: error.message || 'Falha ao excluir comitente.' };
  }
}
