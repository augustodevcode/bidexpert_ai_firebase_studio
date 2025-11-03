// src/services/subscriber.service.ts
/**
 * @fileoverview Lógica de negócio para a entidade Subscriber.
 * gerencia a criação de novos inscritos na newsletter.
 */
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // Importar Prisma
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
    const tenantIdAsBigInt = BigInt(tenantId);

    try {
      // Verifica se já existe um assinante com este email para este tenant
      const existingSubscriber = await prisma.subscriber.findFirst({
        where: {
          email,
          tenantId: tenantIdAsBigInt
        },
      });

      if (existingSubscriber) {
        return { success: false, message: 'Este e-mail já está inscrito.' };
      }

      // Cria um novo assinante
      await prisma.subscriber.create({
        data: {
          email,
          name,
          tenantId: tenantIdAsBigInt
        },
      });

      return { success: true, message: 'Inscrição realizada com sucesso!' };
    } catch (error: any) {
      console.error("[SubscriberService] Error creating subscriber:", error);
      // Trata erros de chave duplicada ou outros erros do Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return { success: false, message: 'Este e-mail já está inscrito.' };
        }
      }
      return { 
        success: false, 
        message: 'Não foi possível completar a inscrição no momento. Por favor, tente novamente mais tarde.' 
      };
    }
  }

  async deleteMany(where: Prisma.SubscriberWhereInput) {
    return prisma.subscriber.deleteMany({ where });
  }
}
