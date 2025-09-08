// packages/core/src/services/user-win.service.ts
import { UserWinRepository } from '../repositories/user-win.repository';
import { ReportsRepository } from '../repositories/reports.repository';
import type { UserWin, UserReportData } from '../types';

export class UserWinService {
  private repository: UserWinRepository;
  private reportsRepository: ReportsRepository;


  constructor() {
    this.repository = new UserWinRepository();
    this.reportsRepository = new ReportsRepository(); // Adicionado para buscar categorias
  }

  private formatWin(win: any): UserWin | null {
    if (!win) return null;
    const lotWithAuctionName = win.lot ? {
      ...win.lot,
      auctionName: win.lot.auction?.title,
    } : null;
    return { ...win, lot: lotWithAuctionName };
  }

  async getWinDetails(winId: string): Promise<UserWin | null> {
    const win = await this.repository.findById(winId);
    return this.formatWin(win);
  }

  async findWinsByUserId(userId: string): Promise<UserWin[]> {
    const wins = await this.repository.findWinsByUserId(userId);
    return wins.map(win => this.formatWin(win)).filter(Boolean) as UserWin[];
  }
  
  async getWinsForConsignor(sellerId: string): Promise<UserWin[]> {
    const wins = await this.repository.findWinsBySellerId(sellerId);
    return wins.map((win: any) => ({
      ...this.formatWin(win),
      user: { fullName: win.user?.fullName },
    }));
  }

  async getUserReportData(userId: string): Promise<UserReportData> {
    if (!userId) {
      throw new Error("User ID is required to generate a report.");
    }
    
    const wins = await this.repository.findWinsByUserId(userId);
    const totalLotsWon = wins.length;
    const totalAmountSpent = wins.reduce((sum, win) => sum + win.winningBidAmount, 0);

    const totalBidsPlaced = await this.reportsRepository.getAllBids().then(bids => bids.length); // Ajustado para usar o repo

    const categorySpendingMap = new Map<string, number>();
    const allCategories = await this.reportsRepository.getAllCategories();
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
