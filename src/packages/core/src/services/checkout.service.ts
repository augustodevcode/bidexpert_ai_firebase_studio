// packages/core/src/services/checkout.service.ts
import { UserWinRepository } from './../repositories/user-win.repository';
import { CheckoutRepository } from '../repositories/checkout.repository';
import type { CheckoutFormValues } from '../lib/zod-schemas';
import { revalidatePath } from 'next/cache';
import { add } from 'date-fns';

// Helper function to fetch commission rate from the BFF
async function getCommissionRate(): Promise<number> {
  try {
    // In a deployed environment, this URL should be absolute and internal.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    const response = await fetch(`${baseUrl}/api/commission`);
    
    if (!response.ok) {
        console.error(`Failed to fetch commission rate, status: ${response.status}`);
        // Fallback to a default value if the service fails
        return 0.05; 
    }
    const data = await response.json();
    return data.default_commission_rate || 0.05;
  } catch (error) {
    console.error("Error fetching commission rate from BFF:", error);
    // Fallback to a default value in case of network errors
    return 0.05;
  }
}


export class CheckoutService {
  private userWinRepository: UserWinRepository;
  private checkoutRepository: CheckoutRepository;
  
  constructor() {
    this.userWinRepository = new UserWinRepository();
    this.checkoutRepository = new CheckoutRepository();
  }

  async calculateTotals(winId: string): Promise<{
    winningBidAmount: number;
    commissionRate: number;
    commissionValue: number;
    totalDue: number;
  }> {
    const win = await this.userWinRepository.findByIdSimple(winId);
    if (!win) {
      throw new Error('Registro de arremate não encontrado.');
    }
    
    const commissionRate = await getCommissionRate();
    const commissionValue = win.winningBidAmount * commissionRate;
    const totalDue = win.winningBidAmount + commissionValue;

    return {
      winningBidAmount: win.winningBidAmount,
      commissionRate,
      commissionValue,
      totalDue,
    };
  }

  async processPayment(winId: string, paymentData: CheckoutFormValues): Promise<{ success: boolean; message: string }> {
    const win = await this.userWinRepository.findByIdSimple(winId);

    if (!win) {
        return { success: false, message: 'Registro do arremate não encontrado.' };
    }
    
    if (win.paymentStatus === 'PAGO') {
        return { success: false, message: 'Este arremate já foi pago.'};
    }
    
    const totals = await this.calculateTotals(winId);

    // In a real scenario, you would integrate with a payment gateway here using the totals.
    // For this simulation, we'll just update the status.
    console.log(`[SERVICE - processPayment] Processing payment for win ID: ${winId}`, {paymentData, totals});
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
        if (paymentData.paymentMethod === 'credit_card') {
            await this.userWinRepository.update(winId, { paymentStatus: 'PAGO' });
            if (process.env.NODE_ENV !== 'test') {
                revalidatePath(`/dashboard/wins`);
                revalidatePath(`/checkout/${winId}`);
            }
            return { success: true, message: "Pagamento à vista processado com sucesso!" };
        } 
        
        if (paymentData.paymentMethod === 'installments') {
            const installmentCount = paymentData.installments || 1;
            const installmentAmount = totals.totalDue / installmentCount; // Simple division for simulation
            
            const installmentsToCreate = Array.from({ length: installmentCount }, (_, i) => ({
                userWinId: winId,
                installmentNumber: i + 1,
                amount: installmentAmount,
                dueDate: add(new Date(), { months: i + 1 }),
                status: 'PENDENTE' as const
            }));
            
            await this.checkoutRepository.createInstallments({data: installmentsToCreate});
            await this.userWinRepository.update(winId, { paymentStatus: 'PROCESSANDO' });
            
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
}
