// src/services/user-win.service.ts
/**
 * @fileoverview Este arquivo contém a classe UserWinService, que encapsula
 * a lógica de negócio para o gerenciamento de arremates de usuários.
 * O serviço interage com o repositório para buscar informações detalhadas
 * sobre os lotes que um usuário arrematou, formatando os dados para exibição
 * no painel do usuário.
 */
import { UserWinRepository } from '@/repositories/user-win.repository';
import type { UserWin } from '@/types';
import { prisma } from '@/lib/prisma';

export class UserWinService {
  private repository: UserWinRepository;
  private prisma;

  constructor() {
    this.repository = new UserWinRepository();
    this.prisma = prisma;
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
      lot: lotWithAuctionName as any,
    };
  }
}
