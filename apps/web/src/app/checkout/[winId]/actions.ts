
// src/app/checkout/[winId]/actions.ts
'use server';

import type { UserWin, CheckoutFormValues } from '@bidexpert/core';
import { CheckoutService } from '@bidexpert/core/services';

const checkoutService = new CheckoutService();

/**
 * Fetches the details for a specific user win to display on the checkout page.
 * It includes the related lot and auction information.
 * @param {string} winId - The ID of the user win record.
 * @returns {Promise<UserWin | null>} The detailed user win object, or null if not found.
 */
export async function getWinDetailsForCheckoutAction(winId: string): Promise<UserWin | null> {
  // A service UserWinService precisa ser refatorada para ter o método obterDetalhes ao invés de getWinDetails.
  // Por agora, vamos assumir que a lógica interna do serviço está em português.
  // A chamada ao service UserWinService.getWinDetails foi movida para o checkout service,
  // mas idealmente teríamos um UserWinService.obterDetalhes
  const userWinService = new (await import('@bidexpert/core/services')).UserWinService();
  return userWinService.getWinDetails(winId);
}

/**
 * Calculates the final totals for a given win, including commission.
 * @param {string} winId - The ID of the user win record.
 * @returns An object with the calculated totals.
 */
export async function getCheckoutTotalsAction(winId: string) {
    return checkoutService.calcularTotais(winId);
}

/**
 * Processes a payment for a won lot. This can be a one-time payment or create
 * installment records.
 * @param {string} winId - The ID of the user win record.
 * @param {CheckoutFormValues} paymentData - The validated payment form data.
 * @returns {Promise<{success: boolean; message: string}>} The result of the payment operation.
 */
export async function processPaymentAction(winId: string, paymentData: CheckoutFormValues): Promise<{success: boolean; message: string}> {
    return checkoutService.processarPagamento(winId, paymentData);
}
