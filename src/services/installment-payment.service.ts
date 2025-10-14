/**
 * @fileoverview Serviço para a lógica de negócios relacionada a pagamentos parcelados.
 */

import { PrismaClient } from '@prisma/client';
import { InstallmentPaymentRepository } from '../repositories/installment-payment.repository';
import { UserWinRepository } from '../repositories/user-win.repository';

const prisma = new PrismaClient();

export class InstallmentPaymentService {
  private installmentRepository: InstallmentPaymentRepository;
  private userWinRepository: UserWinRepository;

  constructor() {
    this.installmentRepository = new InstallmentPaymentRepository();
    this.userWinRepository = new UserWinRepository();
  }

  /**
   * Cria as parcelas para um arremate específico.
   * @param userWinId O ID do arremate.
   * @param numberOfInstallments O número de parcelas a serem criadas.
   * @returns Um objeto de resultado com sucesso ou falha.
   */
  async createInstallmentsForWin(userWinId: string, numberOfInstallments: number) {
    if (numberOfInstallments <= 0) {
      return { success: false, message: "O número de parcelas deve ser positivo." };
    }

    try {
      const userWin = await this.userWinRepository.findById(userWinId);

      if (!userWin) {
        return { success: false, message: "Arremate não encontrado." };
      }

      const totalAmount = userWin.finalPrice + (userWin.commission || 0);
      const installmentAmount = parseFloat((totalAmount / numberOfInstallments).toFixed(2));

      const installments = [];
      let accumulatedAmount = 0;

      for (let i = 1; i <= numberOfInstallments; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);

        let currentInstallmentAmount = installmentAmount;
        accumulatedAmount += installmentAmount;

        // Adjust last installment to match total amount exactly
        if (i === numberOfInstallments) {
          const difference = totalAmount - accumulatedAmount;
          currentInstallmentAmount += parseFloat(difference.toFixed(2));
        }

        installments.push({
          userWinId: userWin.id,
          lotId: userWin.lotId,
          installmentNumber: i,
          totalInstallments: numberOfInstallments,
          amount: currentInstallmentAmount,
          dueDate: dueDate,
        });
      }

      await this.installmentRepository.createMany(installments);

      return { success: true, message: `${numberOfInstallments} parcelas criadas com sucesso.` };
    } catch (error) {
      console.error(`Error creating installments for win ${userWinId}:`, error);
      return { success: false, message: "Falha ao criar as parcelas." };
    }
  }
}
