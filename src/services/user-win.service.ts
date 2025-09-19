// src/services/user-win.service.ts
import { UserWinRepository } from '@/repositories/user-win.repository';
import type { UserWin } from '@/types';

export class UserWinService {
  private repository: UserWinRepository;

  constructor() {
    this.repository = new UserWinRepository();
  }

  async getWinDetailsById(winId: string): Promise<UserWin | null> {
    const win = await this.repository.findByIdWithDetails(winId);
    if (!win) {
      return null;
    }

    const lotWithAuctionName = {
      ...win.lot,
      price: Number(win.lot.price),
      initialPrice: win.lot.initialPrice ? Number(win.lot.initialPrice) : null,
      secondInitialPrice: win.lot.secondInitialPrice ? Number(win.lot.secondInitialPrice) : null,
      bidIncrementStep: win.lot.bidIncrementStep ? Number(win.lot.bidIncrementStep) : null,
      auctionName: win.lot.auction.title,
    };

    return {
      ...win,
      winningBidAmount: Number(win.winningBidAmount),
      lot: lotWithAuctionName,
    };
  }
}
