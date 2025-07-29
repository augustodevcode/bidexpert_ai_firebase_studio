// src/app/admin/lots/actions.ts
'use server';

import type { Lot, Bem, LotFormData, UserWin } from '@/types';
import { revalidatePath } from 'next/cache';
import { LotService } from '@/services/lot.service';
import { BemRepository } from '@/repositories/bem.repository';
import { prisma } from '@/lib/prisma';
import { generateDocument } from '@/ai/flows/generate-document-flow';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const lotService = new LotService();
const bemRepository = new BemRepository();

export async function getLots(auctionId?: string): Promise<Lot[]> {
  return lotService.getLots(auctionId);
}

export async function getLot(id: string): Promise<Lot | null> {
  return lotService.getLotById(id);
}

export async function createLot(data: Partial<LotFormData>): Promise<{ success: boolean, message: string, lotId?: string }> {
  const result = await lotService.createLot(data);
  if (result.success) {
    revalidatePath('/admin/lots');
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
  }
  return result;
}

export async function updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean, message: string }> {
  const result = await lotService.updateLot(id, data);
  if (result.success) {
      revalidatePath('/admin/lots');
      revalidatePath(`/admin/lots/${id}/edit`);
      if (data.auctionId) {
        revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
      }
  }
  return result;
}

export async function deleteLot(id: string, auctionId?: string): Promise<{ success: boolean, message: string }> {
  const lotToDelete = await lotService.getLotById(id);
  const finalAuctionId = auctionId || lotToDelete?.auctionId;

  const result = await lotService.deleteLot(id);
  
  if (result.success) {
    revalidatePath('/admin/lots');
    if (finalAuctionId) {
      revalidatePath(`/admin/auctions/${finalAuctionId}/edit`);
    }
  }
  return result;
}

export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
  return bemRepository.findByIds(ids);
}

export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  if (ids.length === 0) return [];
  // @ts-ignore
  return prisma.lot.findMany({ where: { id: { in: ids } }, include: { auction: true } });
}

export async function finalizeLot(lotId: string): Promise<{ success: boolean; message: string }> {
  const result = await lotService.finalizeLot(lotId);
  if (result.success) {
    const lot = await lotService.getLotById(lotId);
    if(lot) {
      revalidatePath(`/admin/lots/${lotId}/edit`);
      revalidatePath(`/admin/auctions/${lot.auctionId}/edit`);
    }
  }
  return result;
}

export async function generateWinningBidTermAction(lotId: string): Promise<{ success: boolean; message: string; pdfBase64?: string; fileName?: string; }> {
  const lot = await lotService.getLotById(lotId);
  if (!lot || !lot.winnerId || !lot.auction) {
    return { success: false, message: 'Dados insuficientes para gerar o termo. Verifique se o lote foi finalizado e possui um vencedor.' };
  }
  
  const winner = await prisma.user.findUnique({ where: { id: lot.winnerId } });
  if (!winner) {
    return { success: false, message: 'Arrematante não encontrado.'};
  }

  const { auction } = lot;
  const auctioneer = auction.auctioneer;
  const seller = auction.seller;

  try {
    const result = await generateDocument({
      documentType: 'WINNING_BID_TERM',
      data: {
        lot: lot,
        auction: auction,
        winner: winner,
        auctioneer: auctioneer,
        seller: seller,
        currentDate: format(new Date(), 'dd/MM/yyyy', { locale: ptBR }),
      },
    });

    if (result.pdfBase64 && result.fileName) {
      // For simplicity, we are returning the PDF directly to the client to handle the download.
      // A more robust implementation would save this to a secure storage (like Firebase Storage)
      // and then save the URL in the lot's `winningBidTermUrl` field.
      await updateLot(lotId, { winningBidTermUrl: `/${result.fileName}` }); // Placeholder URL
      return { ...result, success: true, message: 'Documento gerado com sucesso!' };
    } else {
      throw new Error("A geração do PDF não retornou os dados esperados.");
    }

  } catch (error: any) {
    console.error("Error generating winning bid term:", error);
    return { success: false, message: `Falha ao gerar documento: ${error.message}` };
  }
}

export async function updateLotFeaturedStatus(id: string, isFeatured: boolean): Promise<{ success: boolean, message: string }> {
  return updateLot(id, { isFeatured });
}

export async function updateLotTitle(id: string, title: string): Promise<{ success: boolean, message: string }> {
  return updateLot(id, { title });
}

export async function updateLotImage(id: string, mediaItemId: string, imageUrl: string): Promise<{ success: boolean, message: string }> {
  return updateLot(id, { imageMediaId: mediaItemId, imageUrl });
}
