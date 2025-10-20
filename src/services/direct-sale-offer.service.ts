import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class DirectSaleOfferService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async deleteMany(args: any) {
    await this.prisma.directSaleOffer.deleteMany(args);
  }
}