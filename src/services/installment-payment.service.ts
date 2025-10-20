import prisma from '../lib/prisma';

export class InstallmentPaymentService {
  async deleteMany() {
    await prisma.installmentPayment.deleteMany({});
  }
}