// src/services/installment-payment.service.ts
/**
 * @fileoverview Este arquivo contém a classe InstallmentPaymentService, que encapsula
 * a lógica de negócio para o gerenciamento de parcelamentos de pagamentos de lotes arrematados.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma, PaymentStatus } from '@prisma/client';
import type { UserWin as AppUserWin } from '@/types';
import { add } from 'date-fns';
import { nowInSaoPaulo, convertSaoPauloToUtc } from '@/lib/timezone';
import { Decimal } from '@prisma/client/runtime/library';

export class InstallmentPaymentService {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Cria os registros de parcelamento para um lote arrematado.
   * @param userWin - O registro do arremate (tipo da aplicação).
   * @param totalInstallments - O número total de parcelas.
   * @returns Um objeto indicando o sucesso e as parcelas criadas.
   */
  async createInstallmentsForWin(userWin: AppUserWin, totalInstallments: number): Promise<{ success: boolean; payments: Prisma.InstallmentPaymentGetPayload<{}>[] }> {
    const winningBidAmount = new Decimal(userWin.winningBidAmount);
    if (winningBidAmount.isNaN() || winningBidAmount.isNegative() || winningBidAmount.isZero()) {
      throw new Error("Valor do arremate inválido.");
    }
    
    const interestRate = new Decimal(0.015).times(totalInstallments);
    const totalAmountWithInterest = winningBidAmount.times(new Decimal(1).plus(interestRate));
    const installmentAmount = totalAmountWithInterest.dividedBy(totalInstallments);
    const payments: Prisma.InstallmentPaymentCreateManyInput[] = [];
    const userWinIdAsBigInt = BigInt(userWin.id);

    for (let i = 1; i <= totalInstallments; i++) {
      const dueDate = convertSaoPauloToUtc(add(nowInSaoPaulo(), { months: i }));
      payments.push({
        userWinId: userWinIdAsBigInt,
        installmentNumber: i,
        totalInstallments: totalInstallments,
        amount: installmentAmount,
        dueDate: dueDate,
        status: 'PENDENTE',
      });
    }

    await this.prisma.installmentPayment.createMany({
      data: payments,
    });

    const createdPayments = await this.prisma.installmentPayment.findMany({ where: { userWinId: userWinIdAsBigInt } });
    return { success: true, payments: createdPayments };
  }

  /**
   * Atualiza o status de uma parcela específica.
   * @param paymentId - O ID da parcela.
   * @param status - O novo status do pagamento.
   */
  async updatePaymentStatus(paymentId: bigint, status: PaymentStatus): Promise<void> {
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
