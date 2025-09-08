// src/services/user-win.service.ts
import { UserWinRepository } from '@/repositories/user-win.repository';
import type { UserWin, UserReportData } from '@/types';
import { prisma } from '@/lib/prisma'; // Keep for specific queries

export class UserWinService {
  private repository: UserWinRepository;

  constructor() {
    this.repository = new UserWinRepository();
  }

  async getWinDetails(winId: string): Promise<UserWin | null> {
    const win = await this.repository.findById(winId);
    if (!win) {
      return null;
    }

    // Flatten the auction name into the lot object for easier access
    const lotWithAuctionName = {
      ...win.lot,
      auctionName: win.lot.auction.title,
    };

    // @ts-ignore
    return { ...win, lot: lotWithAuctionName };
  }

  async findWinsByUserId(userId: string): Promise<UserWin[]> {
    const wins = await this.repository.findWinsByUserId(userId);
    // @ts-ignore
    return wins;
  }
  
  async getWinsForConsignor(sellerId: string): Promise<UserWin[]> {
    const wins = await this.repository.findWinsBySellerId(sellerId);
    return wins.map((win: any) => ({
      ...win,
      user: { fullName: win.user.fullName } // Only expose what's needed
    }));
  }

  async getUserReportData(userId: string): Promise<UserReportData> {
    if (!userId) {
      throw new Error("User ID is required to generate a report.");
    }
    
    const wins = await this.repository.findWinsByUserId(userId);
    const totalLotsWon = wins.length;
    const totalAmountSpent = wins.reduce((sum, win) => sum + win.winningBidAmount, 0);

    const totalBidsPlaced = await prisma.bid.count({
      where: { bidderId: userId },
    });

    const categorySpendingMap = new Map<string, number>();
    const allCategories = await prisma.lotCategory.findMany({ select: { id: true, name: true }});
    const categoryNameMap = new Map(allCategories.map(c => [c.id, c.name]));
    
    wins.forEach(win => {
        const categoryId = win.lot?.categoryId;
        if (categoryId) {
            const categoryName = categoryNameMap.get(categoryId) || 'Outros';
            const currentAmount = categorySpendingMap.get(categoryName) || 0;
            categorySpendingMap.set(categoryName, currentAmount + win.winningBidAmount);
        }
    });

    const spendingByCategory = Array.from(categorySpendingMap, ([name, value]) => ({ name, value }));

    return {
      totalLotsWon,
      totalAmountSpent,
      totalBidsPlaced,
      spendingByCategory,
    };
  }
}
