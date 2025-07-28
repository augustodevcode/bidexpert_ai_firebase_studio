
// src/services/lot.service.ts
import { LotRepository } from '@/repositories/lot.repository';
import type { Lot, LotFormData } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

export class LotService {
  private repository: LotRepository;

  constructor() {
    this.repository = new LotRepository();
  }

  async getLots(auctionId?: string): Promise<Lot[]> {
    const lots = await this.repository.findAll(auctionId);
    return lots.map(lot => ({
      ...lot,
      auctionName: lot.auction?.title,
      categoryName: lot.category?.name,
      subcategoryName: lot.subcategory?.name,
      bens: lot.bens.map((lb: any) => lb.bem) || [], // Extract bem from LotBens
    }));
  }

  async getLotById(id: string): Promise<Lot | null> {
    const lot = await this.repository.findById(id);
    if (!lot) return null;
    return {
      ...lot,
      auctionName: lot.auction?.title,
      bens: lot.bens?.map((lb: any) => lb.bem) || []
    };
  }

  async createLot(data: Partial<LotFormData>): Promise<{ success: boolean; message: string; lotId?: string; }> {
    try {
      if (!data.auctionId) {
        return { success: false, message: "É obrigatório associar o lote a um leilão." };
      }
      if (!data.type) { // Corrigido de categoryId para type para corresponder ao form
          return { success: false, message: "A categoria é obrigatória para o lote."}
      }

      const { bemIds, categoryId, auctionId, ...lotData } = data; // Extrair auctionId para não ser passado diretamente

      const dataToCreate: Prisma.LotCreateInput = {
        ...(lotData as any),
        price: Number(lotData.price) || 0,
        initialPrice: Number(lotData.initialPrice) || Number(lotData.price) || 0,
        publicId: `LOTE-PUB-${uuidv4().substring(0,8)}`,
        slug: slugify(lotData.title || ''),
        auction: { connect: { id: auctionId } }, // Usar o auctionId extraído para conectar
        category: { connect: { id: data.type } }, // 'type' do form mapeia para 'categoryId' no BD
      };

      if (lotData.subcategoryId) {
          dataToCreate.subcategory = { connect: { id: lotData.subcategoryId } };
      }
      
      const newLot = await this.repository.create(dataToCreate, bemIds || []);
      return { success: true, message: 'Lote criado com sucesso.', lotId: newLot.id };
    } catch (error: any) {
      console.error("Error in LotService.createLot:", error);
      return { success: false, message: `Falha ao criar lote: ${error.message}` };
    }
  }

  async updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const { bemIds, categoryId, ...lotData } = data; // Usar 'type' do form
      const dataToUpdate: Prisma.LotUpdateInput = { ...lotData };

      if (lotData.title) {
        dataToUpdate.slug = slugify(lotData.title);
      }
       if (lotData.type) { // 'type' do form mapeia para 'categoryId'
        dataToUpdate.category = { connect: { id: lotData.type } };
      }
       if (lotData.auctionId) {
        dataToUpdate.auction = { connect: { id: lotData.auctionId } };
      }
      
      await this.repository.update(id, dataToUpdate, bemIds);
      return { success: true, message: 'Lote atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in LotService.updateLot for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar lote: ${error.message}` };
    }
  }

  async deleteLot(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      // The repository now handles the transactional deletion of Lot and LotBens.
      await this.repository.delete(id);
      return { success: true, message: 'Lote excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in LotService.deleteLot for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir lote: ${error.message}` };
    }
  }
  
  async finalizeLot(lotId: string): Promise<{ success: boolean; message: string }> {
      const lot = await this.getLotById(lotId);
      if (!lot) return { success: false, message: "Lote não encontrado." };
      if (lot.status !== 'ABERTO_PARA_LANCES' && lot.status !== 'ENCERRADO') {
          return { success: false, message: `O lote não pode ser finalizado no status atual (${lot.status}).`};
      }

      const winningBid = await prisma.bid.findFirst({
          where: { lotId: lot.id },
          orderBy: { amount: 'desc' },
      });

      if (winningBid) {
          await prisma.lot.update({
              where: { id: lot.id },
              data: { status: 'VENDIDO', winnerId: winningBid.bidderId, price: winningBid.amount },
          });
           await prisma.userWin.create({
              data: {
                  lotId: lot.id,
                  userId: winningBid.bidderId,
                  winningBidAmount: winningBid.amount,
                  winDate: new Date(),
                  paymentStatus: 'PENDENTE'
              }
          });
          return { success: true, message: `Lote finalizado! Vencedor: ${winningBid.bidderDisplay} com R$ ${winningBid.amount.toLocaleString('pt-BR')}.`};
      } else {
           await prisma.lot.update({
              where: { id: lot.id },
              data: { status: 'NAO_VENDIDO' },
          });
           return { success: true, message: "Lote finalizado como 'Não Vendido' por falta de lances." };
      }
  }
}
