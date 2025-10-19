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
import type { Prisma } from '@prisma/client';

export class UserWinService {
  private repository: UserWinRepository;
  private prisma;

  constructor() {
    this.repository = new UserWinRepository();
    this.prisma = prisma;
  }

  async create(data: Prisma.UserWinCreateInput): Promise<UserWin> {
    return this.prisma.userWin.create({ data });
  }

  async findFirst(args: Prisma.UserWinFindFirstArgs): Promise<UserWin | null> {
    return this.prisma.userWin.findFirst(args);
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

  async deleteAllUserWins(): Promise<{ success: boolean; message: string; }> {
    try {
      await this.prisma.userWin.deleteMany({});
      return { success: true, message: 'Todos os arremates de usuários foram excluídos.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todos os arremates de usuários.' };
    }
  }
}
