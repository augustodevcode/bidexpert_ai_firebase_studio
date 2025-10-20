import prisma from '../lib/prisma';

export class NotificationService {
  async deleteMany() {
    await prisma.notification.deleteMany({});
  }
}