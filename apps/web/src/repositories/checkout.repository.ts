// src/repositories/checkout.repository.ts
import { prisma } from '@bidexpert/core/lib/prisma';
import type { Prisma } from '@prisma/client';

export class CheckoutRepository {
  async createInstallments(data: Prisma.InstallmentPaymentCreateManyInput): Promise<Prisma.BatchPayload> {
    return prisma.installmentPayment.createMany({ data });
  }

  // Futuramente, poderiam ser adicionados métodos para processar pagamentos,
  // registrar transações, etc.
}
