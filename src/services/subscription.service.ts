// src/services/subscription.service.ts
/**
 * @fileoverview Service layer for handling newsletter subscriptions.
 * Encapsulates the business logic for creating and managing subscribers.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { tenantContext } from '@/lib/tenant-context';

export interface SubscriptionFormData {
  email: string;
  name?: string;
  phone?: string;
  preferences?: any;
}

export class SubscriptionService {
  
  /**
   * Creates a new subscriber for the current tenant.
   * Checks for duplicates before creating.
   * @param data - The subscriber's data.
   * @returns The result of the creation operation.
   */
  async createSubscriber(data: SubscriptionFormData): Promise<{ success: boolean; message: string; }> {
    const tenantId = tenantContext.getStore()?.tenantId;
    if (!tenantId) {
        return { success: false, message: 'Contexto de tenant não encontrado.' };
    }

    try {
      const { email, name, phone, preferences } = data;

      if (!email) {
        return { success: false, message: 'O e-mail é obrigatório.' };
      }

      const existingSubscriber = await prisma.subscriber.findUnique({
        where: { email },
      });

      if (existingSubscriber) {
        return { success: false, message: 'Este e-mail já está inscrito.' };
      }

      await prisma.subscriber.create({
        data: {
          email,
          name,
          phone,
          preferences: preferences || {},
          tenant: { connect: { id: tenantId } },
        },
      });

      return { success: true, message: 'Inscrição realizada com sucesso!' };

    } catch (error: any) {
      console.error("[SubscriptionService] Error creating subscriber:", error);
      return { success: false, message: `Falha ao processar inscrição: ${error.message}` };
    }
  }
}
