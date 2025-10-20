import prisma from '../lib/prisma';

export class ReviewService {
  async deleteMany() {
    await prisma.review.deleteMany({});
  }
}