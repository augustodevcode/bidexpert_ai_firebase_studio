import { Prisma, LotStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { LotService } from './lot.service';

// Definir o status ATIVO já que não está no enum original
const ACTIVE_STATUS = 'ATIVO' as LotStatus;

export class AutoBidService {
  private lotService: LotService;
  private prisma;

  constructor() {
    this.lotService = new LotService();
    this.prisma = prisma;
  }

  /**
   * Verifica se há lances automáticos para um lote e executa o contra-lance se necessário
   */
  async checkAndPlaceAutoBids(lotId: string, currentBidAmount: number, currentBidderId: string): Promise<boolean> {
    try {
      // Primeiro, obter o ID do próximo lance automático
      const nextAutoBid = await this.prisma.userLotMaxBid.findFirst({
        where: {
          lotId: BigInt(lotId),
          isActive: true,
          maxAmount: { gt: new Prisma.Decimal(currentBidAmount) },
          userId: { not: BigInt(currentBidderId) } // Não pegar o próprio usuário
        },
        orderBy: {
          maxAmount: 'asc' // Pega o menor lance que ainda é maior que o atual
        },
        select: {
          id: true,
          userId: true,
          lotId: true,
          maxAmount: true
        }
      });

      if (!nextAutoBid) {
        return false; // Nenhum lance automático para executar
      }

      // Agora, obter os dados do usuário separadamente
      const user = await this.prisma.user.findUnique({
        where: { id: nextAutoBid.userId },
        select: {
          id: true,
          email: true,
          fullName: true
        }
      });

      if (!user) {
        console.error(`Usuário ${nextAutoBid.userId} não encontrado para lance automático`);
        return false;
      }

      // Calcular o próximo valor de lance (incremento mínimo ou até o máximo do usuário)
      const lot = await this.prisma.lot.findUnique({
        where: { id: BigInt(lotId) },
        select: { 
          bidIncrementStep: true,
          status: true
        }
      });

      if (!lot || lot.status !== ACTIVE_STATUS) {
        return false; // Lote não está mais ativo
      }

      const increment = Number(lot.bidIncrementStep) || 1;
      const nextBidAmount = Math.min(
        currentBidAmount + increment,
        Number(nextAutoBid.maxAmount)
      );

      // Executar o lance automático
      const userDisplayName = user.fullName || 
                            (user.email ? 
                              user.email.split('@')[0] : 
                              `Usuário ${user.id}`);

      await this.lotService.placeBid(
        lotId,
        user.id.toString(),
        nextBidAmount,
        userDisplayName
      );

      return true;
    } catch (error) {
      console.error('Erro ao verificar/executar lances automáticos:', error);
      return false;
    }
  }

  /**
   * Define um lance máximo para um usuário em um lote
   */
  async setUserMaxBid(userId: string, lotId: string, maxAmount: number): Promise<{ success: boolean; message: string }> {
    try {
      const lot = await this.prisma.lot.findUnique({
        where: { id: BigInt(lotId) },
        select: { 
          price: true, // currentBidAmount é armazenado como price no modelo
          status: true,
          bidIncrementStep: true
        }
      });

      if (!lot) {
        return { success: false, message: 'Lote não encontrado.' };
      }

      if (lot.status !== ACTIVE_STATUS) {
        return { success: false, message: 'Este lote não está ativo para lances.' };
      }

      const currentBid = Number(lot.price || 0);
      
      if (maxAmount <= currentBid) {
        return { 
          success: false, 
          message: `O valor máximo deve ser maior que o lance atual de ${currentBid}.` 
        };
      }

      // Criar ou atualizar o lance máximo do usuário
      await this.prisma.userLotMaxBid.upsert({
        where: {
          userId_lotId: {
            userId: BigInt(userId),
            lotId: BigInt(lotId)
          }
        },
        update: {
          maxAmount: new Prisma.Decimal(maxAmount),
          isActive: true
        },
        create: {
          userId: BigInt(userId),
          lotId: BigInt(lotId),
          maxAmount: new Prisma.Decimal(maxAmount),
          isActive: true
        }
      });

      // Usar o incremento já obtido anteriormente
      const increment = Number(lot.bidIncrementStep) || 1;
      
      if (currentBid + increment <= maxAmount) {
        const bidAmount = currentBid === 0 ? increment : currentBid + increment;
        await this.lotService.placeBid(
          lotId,
          userId,
          bidAmount,
          'Lance Automático'
        );
      }

      return { success: true, message: 'Lance automático configurado com sucesso!' };
    } catch (error) {
      console.error('Erro ao configurar lance automático:', error);
      return { 
        success: false, 
        message: error instanceof Error 
          ? `Erro ao configurar lance automático: ${error.message}`
          : 'Erro desconhecido ao configurar lance automático'
      };
    }
  }
}
