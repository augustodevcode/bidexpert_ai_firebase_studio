// apps/web/src/services/checkout.service.ts
import type { CheckoutFormValues } from '@bidexpert/core';

const MICROSERVICE_URL = process.env.COMMISSION_MICROSERVICE_URL || 'http://localhost:3001';

/**
 * This service now acts as a client for the checkout microservice.
 * It's part of the BFF layer.
 */
export class CheckoutService {

  async calculateTotals(winId: string): Promise<{
    winningBidAmount: number;
    commissionRate: number;
    commissionValue: number;
    totalDue: number;
  }> {
    const response = await fetch(`${MICROSERVICE_URL}/api/v1/checkout/${winId}/totals`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Falha ao calcular totais no microserviço.');
    }
    return response.json();
  }

  async processPayment(winId: string, paymentData: CheckoutFormValues): Promise<{ success: boolean; message: string }> {
     const response = await fetch(`${MICROSERVICE_URL}/api/v1/checkout/${winId}/process-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    
    return response.json();
  }
}
