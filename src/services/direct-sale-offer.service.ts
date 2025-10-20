import prisma from '../lib/prisma';

export class DirectSaleOfferService {
  async deleteMany() {
    await prisma.directSaleOffer.deleteMany({});
  }
}