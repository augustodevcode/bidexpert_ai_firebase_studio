import { PrismaClient, UserWin, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class InstallmentPaymentService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createInstallmentsForWin(userWin: UserWin, totalInstallments: number): Promise<{ success: boolean; payments: Prisma.InstallmentPaymentGetPayload<{}>[] }> {
    const installmentAmount = Number(userWin.winningBidAmount) / totalInstallments;
    const payments: Prisma.InstallmentPaymentCreateManyInput[] = [];

    for (let i = 1; i <= totalInstallments; i++) {
      const dueDate = new Date(userWin.winDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      payments.push({
        userWinId: userWin.id,
        installmentNumber: i,
        totalInstallments: totalInstallments,
        amount: installmentAmount,
        dueDate: dueDate,
        status: PaymentStatus.PENDENTE,
      });
    }

    await this.prisma.installmentPayment.createMany({
      data: payments,
    });

    const createdPayments = await this.prisma.installmentPayment.findMany({ where: { userWinId: userWin.id } });
    return { success: true, payments: createdPayments };
  }

  async updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<void> {
    await this.prisma.installmentPayment.update({
      where: { id: paymentId },
      data: { status, paymentDate: status === PaymentStatus.PAGO ? new Date() : null },
    });
  }

  async deleteMany(args: any) {
    await this.prisma.installmentPayment.deleteMany(args);
  }
}