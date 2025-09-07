// src/repositories/habilitation.repository.ts
import { prisma } from '@/lib/prisma';
import type { UserHabilitationStatus, UserDocumentStatus } from '@/types';

export class HabilitationRepository {

  async findHabilitationRequests() {
    return prisma.user.findMany({
      where: {
        habilitationStatus: { in: ['PENDING_ANALYSIS', 'REJECTED_DOCUMENTS', 'PENDING_DOCUMENTS'] }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async createOrUpdateAuctionHabilitation(userId: string, auctionId: string) {
    return prisma.auctionHabilitation.upsert({
      where: { userId_auctionId: { userId, auctionId } },
      update: {},
      create: { userId, auctionId }
    });
  }
  
  async checkAuctionHabilitation(userId: string, auctionId: string): Promise<boolean> {
     const habilitation = await prisma.auctionHabilitation.findUnique({
      where: {
        userId_auctionId: {
          userId,
          auctionId,
        },
      },
    });
    return !!habilitation;
  }
  
  async findUserDocuments(userId: string) {
    return prisma.userDocument.findMany({
        where: { userId },
        include: { documentType: true }
    });
  }
  
  async findDocumentById(id: string) {
      return prisma.userDocument.findUnique({ where: { id }});
  }

  async updateDocumentStatus(id: string, status: UserDocumentStatus, rejectionReason: string | null) {
      return prisma.userDocument.update({
          where: { id },
          data: { status, rejectionReason }
      });
  }
}
