// src/app/subscribe/actions.ts
/**
 * @fileoverview Server Actions para o sistema de inscrição (newsletter).
 * Este arquivo define a ação `subscribeToAction` que é chamada pelos formulários
 * de front-end. Ele recebe os dados do formulário, invoca o `SubscriptionService`
 * para executar a lógica de negócio de criação de um novo assinante e retorna
 * o resultado da operação.
 */
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
