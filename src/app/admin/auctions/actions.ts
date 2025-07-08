// src/app/admin/auctions/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { Auction, AuctionFormData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';

export async function createAuction(data: AuctionFormData): Promise<{
  success: boolean;
  message: string;
  auctionId?: string;
  auctionPublicId?: string;
}> {
  try {
    const auctioneer = await prisma.auctioneer.findFirst({ where: { name: data.auctioneer } });
    if (!auctioneer) return { success: false, message: 'Leiloeiro não encontrado.' };

    const category = await prisma.lotCategory.findFirst({ where: { name: data.category } });
    if (!category) return { success: false, message: 'Categoria não encontrada.' };
    
    let seller = null;
    if (data.seller) {
        seller = await prisma.seller.findFirst({ where: { name: data.seller } });
        if (!seller) return { success: false, message: 'Comitente não encontrado.' };
    }

    const newAuction = await prisma.auction.create({
      data: {
        publicId: `AUC-PUB-${uuidv4().substring(0, 8)}`,
        title: data.title,
        description: data.description,
        status: data.status,
        auctionType: data.auctionType,
        auctionDate: data.auctionDate,
        endDate: data.endDate,
        city: data.city,
        state: data.state,
        imageUrl: data.imageUrl,
        documentsUrl: data.documentsUrl,
        sellingBranch: data.sellingBranch,
        automaticBiddingEnabled: data.automaticBiddingEnabled,
        allowInstallmentBids: data.allowInstallmentBids,
        softCloseEnabled: data.softCloseEnabled,
        softCloseMinutes: data.softCloseMinutes,
        estimatedRevenue: data.estimatedRevenue,
        isFeaturedOnMarketplace: data.isFeaturedOnMarketplace,
        marketplaceAnnouncementTitle: data.marketplaceAnnouncementTitle,
        auctionStages: data.auctionStages || [],
        categoryId: category.id,
        auctioneerId: auctioneer.id,
        sellerId: seller?.id,
      },
    });

    revalidatePath('/admin/auctions');
    revalidatePath('/consignor-dashboard/overview');
    return { success: true, message: 'Leilão criado com sucesso!', auctionId: newAuction.id, auctionPublicId: newAuction.publicId };
  } catch (error: any) {
    console.error("Error creating auction with Prisma:", error);
    return { success: false, message: error.message || 'Falha ao criar leilão.' };
  }
}

export async function getAuctions(): Promise<Auction[]> {
  try {
    const auctions = await prisma.auction.findMany({
      include: {
        _count: {
          select: { lots: true }
        },
        auctioneer: { select: { name: true } },
        seller: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { auctionDate: 'desc' },
    });
    return auctions.map(auction => ({
      ...auction,
      totalLots: auction._count.lots,
      auctioneer: auction.auctioneer?.name,
      seller: auction.seller?.name,
      category: auction.category?.name,
    })) as unknown as Auction[];
  } catch (error: any) {
    console.error("Error fetching auctions with Prisma:", error);
    return [];
  }
}

export async function getAuction(idOrPublicId: string): Promise<Auction | null> {
  try {
    const auction = await prisma.auction.findFirst({
      where: { OR: [{ id: idOrPublicId }, { publicId: idOrPublicId }] },
      include: {
        lots: { orderBy: { number: 'asc' } },
        auctioneer: true,
        seller: true,
        category: true,
      },
    });
    if (!auction) return null;
    return {
      ...auction,
      totalLots: auction.lots.length,
      auctioneerName: auction.auctioneer?.name,
      auctioneerLogoUrl: auction.auctioneer?.logoUrl,
      sellerName: auction.seller?.name,
      category: auction.category?.name,
    } as unknown as Auction;
  } catch (error: any) {
    console.error(`Error fetching auction ${idOrPublicId} with Prisma:`, error);
    return null;
  }
}

export async function updateAuction(
  idOrPublicId: string,
  data: Partial<AuctionFormData>
): Promise<{ success: boolean; message: string }> {
  try {
    const existingAuction = await prisma.auction.findFirst({ where: { OR: [{ id: idOrPublicId }, { publicId: idOrPublicId }] } });
    if (!existingAuction) return { success: false, message: 'Leilão não encontrado.' };

    const { auctioneer, seller, category, ...restOfData } = data;
    const updateData: any = { ...restOfData };
    
    if (auctioneer) {
      const auctioneerRecord = await prisma.auctioneer.findFirst({ where: { name: auctioneer } });
      if (auctioneerRecord) updateData.auctioneerId = auctioneerRecord.id;
    }
    if (seller) {
      const sellerRecord = await prisma.seller.findFirst({ where: { name: seller } });
      if (sellerRecord) updateData.sellerId = sellerRecord.id;
    }
    if (category) {
      const categoryRecord = await prisma.lotCategory.findFirst({ where: { name: category } });
      if (categoryRecord) updateData.categoryId = categoryRecord.id;
    }


    await prisma.auction.update({
      where: { id: existingAuction.id },
      data: updateData,
    });

    revalidatePath('/admin/auctions');
    revalidatePath(`/admin/auctions/${idOrPublicId}/edit`);
    revalidatePath('/consignor-dashboard/overview');
    return { success: true, message: 'Leilão atualizado com sucesso!' };
  } catch (error: any) {
    console.error("Error updating auction with Prisma:", error);
    return { success: false, message: error.message || 'Falha ao atualizar leilão.' };
  }
}


export async function deleteAuction(idOrPublicId: string): Promise<{ success: boolean; message: string }> {
    try {
        const auctionToDelete = await prisma.auction.findFirst({
            where: { OR: [{ id: idOrPublicId }, { publicId: idOrPublicId }] }
        });
        if (!auctionToDelete) return { success: false, message: "Leilão não encontrado." };

        await prisma.auction.delete({ where: { id: auctionToDelete.id } });
        revalidatePath('/admin/auctions');
        return { success: true, message: 'Leilão excluído com sucesso!' };
    } catch (error: any) {
        console.error("Error deleting auction:", error);
        if (error.code === 'P2003') {
            return { success: false, message: 'Não é possível excluir leilão pois ele possui lotes associados.' };
        }
        return { success: false, message: 'Falha ao excluir leilão.' };
    }
}

// Keep other actions as they were, but ensure they use Prisma if needed.
export async function updateAuctionTitle(idOrPublicId: string, newTitle: string): Promise<{ success: boolean; message: string; }> {
    if (!newTitle || newTitle.trim().length < 5) { return { success: false, message: "Título deve ter pelo menos 5 caracteres." }; }
    const result = await updateAuction(idOrPublicId, { title: newTitle });
    if (result.success) {
        revalidatePath(`/auctions/${idOrPublicId}`);
        revalidatePath('/search');
        revalidatePath('/');
    }
    return result;
}

export async function updateAuctionImage(auctionIdOrPublicId: string, mediaItemId: string, imageUrl: string): Promise<{ success: boolean; message: string; }> {
    const result = await updateAuction(auctionIdOrPublicId, { imageMediaId: mediaItemId, imageUrl: imageUrl });
    if (result.success) {
        revalidatePath('/search');
        revalidatePath('/');
    }
    return result;
}

export async function updateAuctionFeaturedStatus(idOrPublicId: string, newStatus: boolean): Promise<{ success: boolean; message: string; }> {
    const result = await updateAuction(idOrPublicId, { isFeaturedOnMarketplace: newStatus });
    if (result.success) {
        revalidatePath('/');
        revalidatePath(`/auctions/${idOrPublicId}`);
        revalidatePath('/search');
    }
    return { success: result.success, message: 'Destaque do leilão atualizado!' };
}

export async function getAuctionsByIds(ids: string[]): Promise<Auction[]> {
  if (!ids || ids.length === 0) return [];
  try {
    const auctions = await prisma.auction.findMany({
        where: { id: { in: ids } },
    });
    return auctions as unknown as Auction[];
  } catch (error) {
      console.error("Error fetching auctions by IDs:", error);
      return [];
  }
}

export async function getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
  try {
    const auctions = await prisma.auction.findMany({
      where: {
        seller: {
          OR: [{ slug: sellerSlugOrPublicId }, { publicId: sellerSlugOrPublicId }],
        },
      },
      include: { 
          lots: true,
          _count: { select: { lots: true }}
      },
    });
    return auctions.map(a => ({...a, totalLots: a._count.lots})) as unknown as Auction[];
  } catch (error) {
    console.error(`Error fetching auctions for seller slug/id ${sellerSlugOrPublicId}:`, error);
    return [];
  }
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlugOrPublicId: string): Promise<Auction[]> {
  try {
    const auctions = await prisma.auction.findMany({
      where: {
        auctioneer: {
          OR: [{ slug: auctioneerSlugOrPublicId }, { publicId: auctioneerSlugOrPublicId }],
        },
      },
      include: {
         _count: { select: { lots: true }}
      },
    });
    return auctions.map(a => ({...a, totalLots: a._count.lots})) as unknown as Auction[];
  } catch (error) {
    console.error(`Error fetching auctions for auctioneer slug/id ${auctioneerSlugOrPublicId}:`, error);
    return [];
  }
}
