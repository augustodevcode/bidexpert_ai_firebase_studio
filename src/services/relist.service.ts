// src/services/relist.service.ts
/**
 * @fileoverview Este arquivo contém a classe RelistService, responsável pela
 * lógica de negócio de "relistar" um lote. Isso envolve criar uma nova cópia
 * de um lote que não foi vendido (ou encerrado sem lances) e associá-lo a um
 * novo leilão, opcionalmente com um desconto, mantendo um vínculo com o lote original.
 */
import { prisma } from '@/lib/prisma';
import { LotService } from './lot.service';
import type { Lot } from '@/types';
import { generatePublicId } from '@/lib/public-id-generator';

export class RelistService {
  private lotService: LotService;
  private prisma;

  constructor() {
    this.lotService = new LotService();
    this.prisma = prisma;
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
      
      const { id, publicId, status, auction, auctionId, createdAt, updatedAt, bidsCount, views, winnerId, winningBidTermUrl, originalLotId: oldOriginalId, ...restOfLotData } = originalLot;

      // Gera novo publicId usando a máscara configurada
      const newPublicId = await generatePublicId(originalLot.tenantId, 'lot');

      const newLotData: Partial<Lot> = {
          ...restOfLotData,
          publicId: newPublicId,
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
      const createResult = await this.lotService.createLot(newLotData, originalLot.tenantId.toString());

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
