// src/app/subscribe/actions.ts
'use server';

import { SubscriptionService, type SubscriptionFormData } from '@/services/subscription.service';

const subscriptionService = new SubscriptionService();

/**
 * Server Action to handle new newsletter/notification subscriptions.
 * @param formData - The data submitted from the subscription form.
 * @returns An object indicating the success or failure of the operation.
 */
export async function subscribeToAction(formData: SubscriptionFormData): Promise<{ success: boolean; message: string; }> {
    try {
        const result = await subscriptionService.createSubscriber(formData);
        return result;
    } catch (error: any) {
        console.error("[subscribeToAction] Error:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}
