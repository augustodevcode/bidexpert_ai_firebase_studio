/**
 * @fileoverview Repositório para a entidade InstallmentPayment, lidando com o acesso ao banco de dados.
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class InstallmentPaymentRepository {
  /**
   * Cria múltiplas parcelas no banco de dados em uma única transação.
   * @param data Os dados para as novas parcelas.
   * @returns O resultado da operação de criação.
   */
  async createMany(data: Prisma.InstallmentPaymentCreateManyInput[]) {
    return await prisma.installmentPayment.createMany({
      data,
    });
  }

  /**
   * Encontra parcelas por ID do arremate.
   * @param userWinId O ID do arremate.
   * @returns Uma lista de parcelas para o arremate especificado.
   */
  async findByUserWinId(userWinId: string) {
    return await prisma.installmentPayment.findMany({
      where: { userWinId },
      orderBy: { installmentNumber: 'asc' },
    });
  }
}
