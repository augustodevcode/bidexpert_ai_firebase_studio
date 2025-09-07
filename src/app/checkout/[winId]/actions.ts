// src/app/checkout/[winId]/actions.ts
'use server';

import type { UserWin } from '@/types';
import { revalidatePath } from 'next/cache';
import { type CheckoutFormValues } from './checkout-form-schema';
import { UserWinService } from '@/services/user-win.service';

const userWinService = new UserWinService();

/**
 * Fetches the details for a specific user win to display on the checkout page.
 * It includes the related lot and auction information.
 * @param {string} winId - The ID of the user win record.
 * @returns {Promise<UserWin | null>} The detailed user win object, or null if not found.
 */
export async function getWinDetailsForCheckoutAction(winId: string): Promise<UserWin | null> {
  try {
    return await userWinService.getWinDetails(winId);
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
    const result = await userWinService.processPayment(winId, paymentData);

    if (result.success) {
        revalidatePath(`/dashboard/wins`);
        revalidatePath(`/checkout/${winId}`);
    }
    
    return result;
}
