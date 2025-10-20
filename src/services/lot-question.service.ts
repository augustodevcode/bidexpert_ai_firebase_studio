import prisma from '../lib/prisma';

export class LotQuestionService {
  async deleteMany() {
    await prisma.lotQuestion.deleteMany({});
  }
}