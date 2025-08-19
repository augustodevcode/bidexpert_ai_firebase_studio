// src/app/checkout/[winId]/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { UserWin } from '@/types';
import { revalidatePath } from 'next/cache';
import { checkoutFormSchema, type CheckoutFormValues } from './checkout-form-schema';
import { add } from 'date-fns';

/**
 * Fetches the details for a specific user win to display on the checkout page.
 * It includes the related lot and auction information.
 * @param {string} winId - The ID of the user win record.
 * @returns {Promise<UserWin | null>} The detailed user win object, or null if not found.
 */
export async function getWinDetailsForCheckoutAction(winId: string): Promise<UserWin | null> {
  try {
    const win = await prisma.userWin.findUnique({
      where: { id: winId },
      include: {
        lot: {
          include: {
            auction: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

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

  } catch (error) {
    console.error(`Error fetching win details for checkout (winId: ${winId}):`, error);
    return null;
  }
}

/**
 * Processes a payment for a won lot. This can be a one-time payment or create
 * installment records.
 * @param {string} winId - The ID of the user win record.
 * @param {CheckoutFormValues} paymentData - The validated payment form data.
 * @returns {Promise<{success: boolean, message: string}>} The result of the payment operation.
 */
export async function processPaymentAction(winId: string, paymentData: CheckoutFormValues): Promise<{success: boolean; message: string}> {
    console.log(`[Action - processPayment] Processing payment for win ID: ${winId}`, paymentData);
    
    const win = await prisma.userWin.findUnique({ where: { id: winId } });

    if (!win) {
        return { success: false, message: 'Registro do arremate não encontrado.' };
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
        if (paymentData.paymentMethod === 'credit_card') {
            // Simulate direct payment processing
            await prisma.userWin.update({
                where: { id: winId },
                data: { paymentStatus: 'PAGO' }
            });
            revalidatePath(`/dashboard/wins`);
            revalidatePath(`/checkout/${winId}`);
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
                prisma.installmentPayment.createMany({
                    data: installmentsToCreate,
                }),
                prisma.userWin.update({
                    where: { id: winId },
                    data: { paymentStatus: 'PROCESSANDO' } // Change status to indicate it's in installments
                })
            ]);
            
            revalidatePath(`/dashboard/wins`);
            revalidatePath(`/checkout/${winId}`);
            return { success: true, message: `${installmentCount} boletos de parcelamento foram gerados com sucesso!` };
        }
        
        return { success: false, message: 'Método de pagamento inválido.' };

    } catch (error: any) {
        console.error(`Error processing payment for win ${winId}:`, error);
        return { success: false, message: `Erro no servidor ao processar pagamento: ${error.message}` };
    }
}
