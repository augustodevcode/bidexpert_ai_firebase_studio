import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class ReviewService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async deleteMany(args: any) {
    await this.prisma.review.deleteMany(args);
  }
}