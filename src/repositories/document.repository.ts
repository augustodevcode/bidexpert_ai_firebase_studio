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
      where: { userId },
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

  async deleteAllUserDocuments(): Promise<void> {
    await this.prisma.userDocument.deleteMany({});
  }
}
