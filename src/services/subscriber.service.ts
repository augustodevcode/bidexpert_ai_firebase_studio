// src/services/subscriber.service.ts
/**
 * @fileoverview Lógica de negócio para a entidade Subscriber.
 * gerencia a criação de novos inscritos na newsletter.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';

// Zod schema for input validation
export const subscriptionFormSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  name: z.string().optional(),
});

export type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>;

export class SubscriberService {
  /**
   * Cria um novo assinante.
   * @param data Os dados do formulário de inscrição.
   * @returns Resultado da operação.
   */
  async createSubscriber(data: SubscriptionFormData, tenantId: string = '1'): Promise<{ success: boolean; message: string; }> {
    const validation = subscriptionFormSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
    }

    const { email, name } = validation.data;

    try {
      const existingSubscriber = await prisma.subscriber.findUnique({
        where: { email_tenantId: { email, tenantId: BigInt(tenantId) } },
      });

      if (existingSubscriber) {
        return { success: false, message: 'Este e-mail já está inscrito.' };
      }

      await prisma.subscriber.create({
        data: {
          email,
          name,
          tenant: { connect: { id: BigInt(tenantId) } }
        },
      });

      return { success: true, message: 'Inscrição realizada com sucesso!' };
    } catch (error: any) {
      console.error("[SubscriberService] Error creating subscriber:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
         return { success: false, message: 'Este e-mail já está inscrito.' };
      }
      return { success: false, message: 'Não foi possível completar a inscrição no momento.' };
    }
  }

  async deleteMany(where: Prisma.SubscriberWhereInput) {
    return prisma.subscriber.deleteMany({ where });
  }
}
