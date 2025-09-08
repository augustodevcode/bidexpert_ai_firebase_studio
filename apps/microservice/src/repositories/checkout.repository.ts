// apps/microservice/src/repositories/checkout.repository.ts
import { prisma } from '@bidexpert/core/lib/prisma';
import type { Prisma } from '@prisma/client';

export class CheckoutRepository {
  async createInstallments(data: Prisma.InstallmentPaymentCreateManyArgs): Promise<Prisma.BatchPayload> {
    return prisma.installmentPayment.createMany(data);
  }
}
