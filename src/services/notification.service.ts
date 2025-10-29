import { PrismaClient, Notification, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class NotificationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createNotification(data: Prisma.NotificationCreateInput): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }

  async deleteMany(args: any) {
    await this.prisma.notification.deleteMany(args);
  }
}