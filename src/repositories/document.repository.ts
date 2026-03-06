// src/repositories/document.repository.ts
import { prisma } from '@/lib/prisma';
import type { DocumentType, UserDocument } from '@/types';
import type { Prisma } from '@prisma/client';

export class DocumentRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  async findAllTypes(): Promise<DocumentType[]> {
    return this.prisma.documentType.findMany({ orderBy: { name: 'asc' } });
  }

  async findUserDocumentsByUserId(userId: string): Promise<any[]> {
    return this.prisma.userDocument.findMany({
      where: { userId: BigInt(userId) },
      include: { documentType: true },
    });
  }

  async upsertUserDocument(data: Prisma.UserDocumentUncheckedCreateInput): Promise<UserDocument> {
    return this.prisma.userDocument.upsert({
      where: {
        userId_documentTypeId: {
          userId: data.userId,
          documentTypeId: data.documentTypeId,
        },
      },
      update: {
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        status: 'PENDING_ANALYSIS',
        rejectionReason: null,
      },
      create: data,
    });
  }

  async updateUserDocumentStatus(
    userId: string,
    documentTypeId: string,
    status: 'APPROVED' | 'REJECTED' | 'PENDING_ANALYSIS' | 'SUBMITTED' | 'NOT_SENT',
    rejectionReason: string | null = null
  ): Promise<UserDocument | null> {
    try {
      return await this.prisma.userDocument.update({
        where: {
          userId_documentTypeId: {
            userId: BigInt(userId),
            documentTypeId: BigInt(documentTypeId),
          },
        },
        data: {
          status,
          rejectionReason,
        },
      });
    } catch (error) {
      // Handle cases where the document might not exist
      console.error(`Error updating document status for user ${userId}:`, error);
      return null;
    }
  }

  async deleteAllUserDocuments(): Promise<void> {
    await this.prisma.userDocument.deleteMany({});
  }

  async deleteAllDocuments(): Promise<void> {
    await this.prisma.document.deleteMany({});
  }
}
