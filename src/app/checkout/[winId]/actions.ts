
// src/app/checkout/[winId]/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { UserWin } from '@/types';
import { revalidatePath } from 'next/cache';

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
 * Simulates processing a payment for a won lot.
 * In a real application, this would call a payment gateway API.
 * @param {string} winId - The ID of the user win record.
 * @param {any} paymentData - The payment form data (e.g., credit card details).
 * @returns {Promise<{success: boolean, message: string}>} The result of the simulated payment.
 */
export async function processPaymentAction(winId: string, paymentData: any): Promise<{success: boolean; message: string}> {
    console.log(`[Action - processPayment] Simulating payment for win ID: ${winId}`, { paymentData });
    
    const win = await prisma.userWin.findUnique({ where: { id: winId } });

    if (!win) {
        return { success: false, message: 'Registro do arremate não encontrado.' };
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real app, you would handle success/failure from the payment gateway
    const paymentSuccessful = true; 

    if (paymentSuccessful) {
        await prisma.userWin.update({
            where: { id: winId },
            data: {
                paymentStatus: 'PAGO'
            }
        });
        revalidatePath(`/dashboard/wins`);
        revalidatePath(`/checkout/${winId}`);
        return { success: true, message: "Pagamento processado com sucesso!" };
    } else {
        await prisma.userWin.update({
            where: { id: winId },
            data: {
                paymentStatus: 'FALHOU'
            }
        });
        revalidatePath(`/checkout/${winId}`);
        return { success: false, message: "O pagamento falhou. Por favor, tente novamente." };
    }
}
