import prisma from '../lib/prisma';

export class SubscriptionService {
  async deleteMany() {
    await prisma.subscription.deleteMany({});
  }
}