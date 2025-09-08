// packages/core/src/services/bid.service.ts
import { BidRepository } from '../repositories/bid.repository';
import { LotService } from './lot.service';
import { HabilitationService } from './habilitation.service';
import { NotificationService } from './notification.service';
import type { UserProfileData, BidInfo, UserLotMaxBid, UserBid } from '../types';
import { revalidatePath } from 'next/cache';

export class BidService {
  private repository: BidRepository;
  private lotService: LotService;
  private habilitationService: HabilitationService;
  private notificationService: NotificationService;

  constructor() {
    this.repository = new BidRepository();
    this.lotService = new LotService();
    this.habilitationService = new HabilitationService();
    this.notificationService = new NotificationService();
  }

  async placeBid(
    lotIdOrPublicId: string,
    auctionIdOrPublicId: string,
    userId: string,
    userDisplayName: string,
    bidAmount: number
  ): Promise<{ success: boolean; message: string; updatedLot?: any; newBid?: BidInfo }> {
    try {
      const lot = await this.lotService.getLotById(lotIdOrPublicId);
      if (!lot) return { success: false, message: 'Lote não encontrado.' };

      const isHabilitado = await this.habilitationService.isUserHabilitatedForAuction(userId, lot.auctionId);
      if (!isHabilitado) {
        return { success: false, message: "Você não está habilitado para dar lances neste leilão." };
      }

      if (lot.status !== 'ABERTO_PARA_LANCES') return { success: false, message: 'Este lote não está aberto para lances.' };
      
      const bidIncrement = lot.bidIncrementStep || 1;
      const nextMinimumBid = lot.price + bidIncrement;
      if (bidAmount < nextMinimumBid) {
        return { success: false, message: `O lance deve ser de no mínimo R$ ${nextMinimumBid.toLocaleString('pt-BR')}.` };
      }

      const previousHighBid = await this.repository.findHighestBid(lot.id);

      const newBid = await this.repository.createBid({
        lot: { connect: { id: lot.id } },
        auction: { connect: { id: lot.auctionId } },
        bidder: { connect: { id: userId } },
        bidderDisplay: userDisplayName,
        amount: bidAmount,
      });

      if (previousHighBid && previousHighBid.bidderId !== userId) {
        await this.notificationService.createNotification({
            userId: previousHighBid.bidderId,
            message: `Seu lance no lote "${lot.title}" foi superado.`,
            link: `/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`,
        });
      }

      await this.lotService.updateLot(lot.id, {
        price: bidAmount,
        bidsCount: (lot.bidsCount || 0) + 1,
      });

      if (process.env.NODE_ENV !== 'test') {
        revalidatePath(`/auctions/${auctionIdOrPublicId}/lots/${lotIdOrPublicId}`);
        revalidatePath(`/auctions/${auctionIdOrPublicId}/live`);
        revalidatePath(`/live-dashboard`);
      }

      const updatedLot = await this.lotService.getLotById(lotIdOrPublicId);
      return { success: true, message: "Lance realizado com sucesso!", updatedLot, newBid };
    } catch (error: any) {
      console.error("Error in BidService.placeBid:", error);
      return { success: false, message: `Ocorreu um erro ao registrar seu lance: ${error.message}` };
    }
  }

  async placeMaxBid(lotId: string, userId: string, maxAmount: number): Promise<{ success: boolean; message: string }> {
    try {
      const lot = await this.lotService.getLotById(lotId);
      if (!lot) return { success: false, message: 'Lote não encontrado.' };

      await this.repository.upsertMaxBid({
        userId,
        lotId: lot.id,
        maxAmount,
        isActive: true,
      });

      if (process.env.NODE_ENV !== 'test') {
        revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
      }
      return { success: true, message: 'Lance máximo definido com sucesso!' };
    } catch (error) {
      console.error("Error setting max bid:", error);
      return { success: false, message: 'Falha ao definir lance máximo.' };
    }
  }

  async getActiveUserLotMaxBid(lotIdOrPublicId: string, userId: string): Promise<UserLotMaxBid | null> {
    if (!userId) return null;
    const lot = await this.lotService.getLotById(lotIdOrPublicId);
    if (!lot) return null;

    try {
      return this.repository.findActiveMaxBid(userId, lot.id);
    } catch (error) {
      console.error("Error fetching active max bid:", error);
      return null;
    }
  }

  async getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
    const lot = await this.lotService.getLotById(lotIdOrPublicId);
    if (!lot) return [];

    try {
      return this.repository.findBidsByLotId(lot.id);
    } catch (error) {
      console.error("Error fetching bids:", error);
      return [];
    }
  }

  async getBidsForUser(userId: string): Promise<UserBid[]> {
    if (!userId) {
      console.warn("[BidService - getBidsForUser] No userId provided.");
      return [];
    }

    const userBidsRaw = await this.repository.findBidsByUserId(userId);

    return userBidsRaw.map((bid) => {
      let bidStatus: UserBid['bidStatus'] = 'PERDENDO';

      if (bid.lot.status === 'ABERTO_PARA_LANCES') {
        if (bid.amount === bid.lot.price) {
          bidStatus = 'GANHANDO';
        } else {
          bidStatus = 'PERDENDO';
        }
      } else if (bid.lot.status === 'VENDIDO') {
        if (bid.lot.winnerId === userId) {
          bidStatus = 'ARREMATADO';
        } else {
          bidStatus = 'NAO_ARREMATADO';
        }
      } else if (bid.lot.status === 'ENCERRADO' || bid.lot.status === 'NAO_VENDIDO') {
        bidStatus = 'ENCERRADO';
      } else if (bid.lot.status === 'CANCELADO') {
        bidStatus = 'CANCELADO';
      }

      return {
        id: bid.id,
        user: {} as any, // User data is not needed here
        amount: bid.amount,
        date: bid.timestamp,
        // @ts-ignore
        lot: { ...bid.lot, auctionName: bid.lot.auction.title },
        bidStatus: bidStatus,
        userBidAmount: bid.amount,
      };
    });
  }
}
