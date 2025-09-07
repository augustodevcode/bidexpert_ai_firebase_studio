// src/services/user-win.service.ts
import { UserWinRepository } from '@/repositories/user-win.repository';
import type { UserWin, CheckoutFormValues, UserReportData } from '@/types';
import { prisma } from '@/lib/prisma';
import { add } from 'date-fns';
import { revalidatePath } from 'next/cache';

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
  
  async getWinsForConsignor(sellerId: string): Promise<UserWin[]> {
    return this.repository.findWinsBySellerId(sellerId);
  }

  async processPayment(winId: string, paymentData: CheckoutFormValues): Promise<{ success: boolean; message: string }> {
    console.log(`[SERVICE - processPayment] Processing payment for win ID: ${winId}`, paymentData);
    
    const win = await this.repository.findByIdSimple(winId);

    if (!win) {
        return { success: false, message: 'Registro do arremate não encontrado.' };
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
        if (paymentData.paymentMethod === 'credit_card') {
            await prisma.userWin.update({
                where: { id: winId },
                data: { paymentStatus: 'PAGO' }
            });
            if (process.env.NODE_ENV !== 'test') {
                revalidatePath(`/dashboard/wins`);
                revalidatePath(`/checkout/${winId}`);
            }
            return { success: true, message: "Pagamento à vista processado com sucesso!" };
        } 
        
        if (paymentData.paymentMethod === 'installments') {
            const installmentCount = paymentData.installments || 1;
            const interestRate = 0.015; // Simulate interest for installments
            const totalWithInterest = win.winningBidAmount * (1 + (interestRate * installmentCount));
            const installmentAmount = totalWithInterest / installmentCount;
            
            const installmentsToCreate = Array.from({ length: installmentCount }, (_, i) => ({
                userWinId: winId,
                installmentNumber: i + 1,
                amount: installmentAmount,
                dueDate: add(new Date(), { months: i + 1 }),
                status: 'PENDENTE' as const
            }));
            
            await prisma.$transaction([
                prisma.installmentPayment.createMany({data: installmentsToCreate}),
                prisma.userWin.update({
                    where: { id: winId },
                    data: { paymentStatus: 'PROCESSANDO' }
                })
            ]);
            
            if (process.env.NODE_ENV !== 'test') {
                revalidatePath(`/dashboard/wins`);
                revalidatePath(`/checkout/${winId}`);
            }
            
            return { success: true, message: `${installmentCount} boletos de parcelamento foram gerados com sucesso!` };
        }
        
        return { success: false, message: 'Método de pagamento inválido.' };

    } catch (error: any) {
        console.error(`Error processing payment for win ${winId}:`, error);
        return { success: false, message: `Erro no servidor ao processar pagamento: ${error.message}` };
    }
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
