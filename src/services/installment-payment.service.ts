// src/services/installment-payment.service.ts
/**
 * @fileoverview Este arquivo contém a classe InstallmentPaymentService, que encapsula
 * a lógica de negócio para o gerenciamento de parcelamentos de pagamentos de lotes arrematados.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma, UserWin, PaymentStatus } from '@prisma/client';
import { add } from 'date-fns';
import { nowInSaoPaulo, convertSaoPauloToUtc } from '@/lib/timezone';

export class InstallmentPaymentService {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Cria os registros de parcelamento para um lote arrematado.
   * @param userWin - O registro do arremate.
   * @param totalInstallments - O número total de parcelas.
   * @returns Um objeto indicando o sucesso e as parcelas criadas.
   */
  async createInstallmentsForWin(userWin: UserWin, totalInstallments: number): Promise<{ success: boolean; payments: Prisma.InstallmentPaymentGetPayload<{}>[] }> {
    const winningBidAmount = Number(userWin.winningBidAmount);
    if (isNaN(winningBidAmount) || winningBidAmount <= 0) {
      throw new Error("Valor do arremate inválido.");
    }
    
    // Simulando juros simples para o parcelamento
    const interestRate = 0.015 * totalInstallments; 
    const totalAmountWithInterest = winningBidAmount * (1 + interestRate);
    const installmentAmount = totalAmountWithInterest / totalInstallments;
    const payments: Prisma.InstallmentPaymentCreateManyInput[] = [];

    for (let i = 1; i <= totalInstallments; i++) {
      const dueDate = convertSaoPauloToUtc(add(nowInSaoPaulo(), { months: i }));
      payments.push({
        userWinId: userWin.id,
        installmentNumber: i,
        amount: installmentAmount,
        dueDate: dueDate,
        status: 'PENDENTE',
      });
    }

    await this.prisma.installmentPayment.createMany({
      data: payments,
    });

    const createdPayments = await this.prisma.installmentPayment.findMany({ where: { userWinId: userWin.id } });
    return { success: true, payments: createdPayments };
  }

  /**
   * Atualiza o status de uma parcela específica.
   * @param paymentId - O ID da parcela.
   * @param status - O novo status do pagamento.
   */
  async updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<void> {
    await this.prisma.installmentPayment.update({
      where: { id: paymentId },
      data: { status, paymentDate: status === 'PAGO' ? nowInSaoPaulo() : null },
    });
  }

  /**
   * Remove todas as parcelas de um arremate (usado em rollbacks ou exclusões).
   */
  async deleteMany(args: Prisma.InstallmentPaymentDeleteManyArgs) {
    await this.prisma.installmentPayment.deleteMany(args);
  }
}
