// src/repositories/installment-payment.repository.ts
/**
 * @fileoverview Repositório para a entidade InstallmentPayment, lidando com o acesso ao banco de dados.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma, InstallmentPayment } from '@prisma/client';

export class InstallmentPaymentRepository {
  /**
   * Cria múltiplas parcelas no banco de dados em uma única transação.
   * @param data Os dados para as novas parcelas.
   * @returns O resultado da operação de criação.
   */
  async createMany(data: Prisma.InstallmentPaymentCreateManyInput[]) {
    return prisma.installmentPayment.createMany({
      data,
    });
  }

  /**
   * Encontra parcelas por ID do arremate.
   * @param userWinId O ID do arremate.
   * @returns Uma lista de parcelas para o arremate especificado.
   */
  async findByUserWinId(userWinId: string): Promise<InstallmentPayment[]> {
    return prisma.installmentPayment.findMany({
      where: { userWinId },
      orderBy: { installmentNumber: 'asc' },
    });
  }

  /**
   * Remove todas as parcelas associadas a um arremate.
   * @param userWinId - O ID do arremate.
   */
  async deleteManyByUserWinId(userWinId: string): Promise<Prisma.BatchPayload> {
    return prisma.installmentPayment.deleteMany({
      where: { userWinId },
    });
  }
}
