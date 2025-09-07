// src/services/user-win.service.ts
import { UserWinRepository } from '@/repositories/user-win.repository';
import type { UserWin, CheckoutFormValues } from '@/types';
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
            await this.repository.update(winId, { paymentStatus: 'PAGO' });
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
                this.repository.createInstallments({data: installmentsToCreate}),
                this.repository.update(winId, { paymentStatus: 'PROCESSANDO' })
            ]);
            
            return { success: true, message: `${installmentCount} boletos de parcelamento foram gerados com sucesso!` };
        }
        
        return { success: false, message: 'Método de pagamento inválido.' };

    } catch (error: any) {
        console.error(`Error processing payment for win ${winId}:`, error);
        return { success: false, message: `Erro no servidor ao processar pagamento: ${error.message}` };
    }
  }
}
