
// src/services/relist.service.ts
import { prisma } from '@/lib/prisma';
import { LotService } from './lot.service';
import type { Lot } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export class RelistService {
  private lotService: LotService;

  constructor() {
    this.lotService = new LotService();
  }

  async relistLot(
    originalLotId: string,
    newAuctionId: string,
    discountPercentage?: number
  ): Promise<{ success: boolean; message: string; newLotId?: string }> {
    try {
      const originalLot = await this.lotService.getLotById(originalLotId);
      if (!originalLot) {
        return { success: false, message: 'Lote original não encontrado.' };
      }

      if (originalLot.status !== 'NAO_VENDIDO' && originalLot.status !== 'ENCERRADO') {
          return { success: false, message: 'Apenas lotes não vendidos ou encerrados sem venda podem ser relistados.'};
      }
      
      const { id, publicId, status, auction, auctionId, createdAt, updatedAt, bidsCount, views, winnerId, winningBidTermUrl, ...restOfLotData } = originalLot;

      const newLotData: Partial<Lot> = {
          ...restOfLotData,
          publicId: `LOTE-PUB-${uuidv4().substring(0,8)}`, // Generate new public ID
          status: 'EM_BREVE',
          auctionId: newAuctionId,
          originalLotId: originalLot.id,
          relistCount: (originalLot.relistCount || 0) + 1,
          isRelisted: true,
          bidsCount: 0,
          views: 0,
          winnerId: null,
          winningBidTermUrl: null,
      };
      
      const evaluationValue = originalLot.evaluationValue ?? originalLot.initialPrice ?? 0;

      if (discountPercentage && discountPercentage > 0) {
          const discountMultiplier = 1 - (discountPercentage / 100);
          newLotData.price = Number(evaluationValue) * discountMultiplier;
          newLotData.initialPrice = Number(evaluationValue) * discountMultiplier;
      } else {
          newLotData.price = Number(evaluationValue);
          newLotData.initialPrice = Number(evaluationValue);
      }
      
      // Create the new lot
      const createResult = await this.lotService.createLot(newLotData, originalLot.tenantId);

      if (!createResult.success) {
          return createResult;
      }
      
      // Update the original lot's status to 'RELISTADO'
      await this.lotService.updateLot(originalLotId, { status: 'RELISTADO' });

      return { success: true, message: 'Lote relistado com sucesso!', newLotId: createResult.lotId };

    } catch (error: any) {
      console.error(`Error in RelistService.relistLot for lotId ${originalLotId}:`, error);
      return { success: false, message: `Falha ao relistar lote: ${error.message}` };
    }
  }
}
