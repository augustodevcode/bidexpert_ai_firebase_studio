// src/app/checkout/[winId]/actions.ts
'use server';

import type { UserWin, CheckoutFormValues } from '@bidexpert/core';
import { UserWinService } from '@bidexpert/services'; 
import { CheckoutService } from '@/services/checkout.service'; // Agora aponta para o novo local

const userWinService = new UserWinService();
const checkoutService = new CheckoutService();

/**
 * Fetches the details for a specific user win to display on the checkout page.
 * It includes the related lot and auction information.
 * @param {string} winId - The ID of the user win record.
 * @returns {Promise<UserWin | null>} The detailed user win object, or null if not found.
 */
export async function getWinDetailsForCheckoutAction(winId: string): Promise<UserWin | null> {
  return userWinService.getWinDetails(winId);
}

/**
 * Calculates the final totals for a given win, including commission.
 * This function now acts as a BFF, calling the microservice.
 * @param {string} winId - The ID of the user win record.
 * @returns An object with the calculated totals.
 */
export async function getCheckoutTotalsAction(winId: string) {
    return checkoutService.calculateTotals(winId);
}

/**
 * Processes a payment for a won lot. This function now acts as a BFF.
 * @param {string} winId - The ID of the user win record.
 * @param {CheckoutFormValues} paymentData - The validated payment form data.
 * @returns {Promise<{success: boolean; message: string}>} The result of the payment operation.
 */
export async function processPaymentAction(winId: string, paymentData: CheckoutFormValues): Promise<{success: boolean; message: string}> {
    return checkoutService.processPayment(winId, paymentData);
}
