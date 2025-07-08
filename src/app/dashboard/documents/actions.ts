
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { DocumentType, UserDocument, Bem } from '@/types';

export async function getDocumentTypes(): Promise<DocumentType[]> {
  try {
    const types = await prisma.documentType.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    return types as unknown as DocumentType[];
  } catch (error) {
    console.error("Error fetching document types:", error);
    return [];
  }
}

export async function getUserDocuments(userId: string): Promise<UserDocument[]> {
  if (!userId) {
    console.warn("[Action - getUserDocuments] No userId provided.");
    return [];
  }
  try {
    const docs = await prisma.userDocument.findMany({
        where: { userId },
        include: { documentType: true }
    });
    return docs as unknown as UserDocument[];
  } catch (error) {
    console.error("Error fetching user documents:", error);
    return [];
  }
}

export async function saveUserDocument(
  userId: string,
  documentTypeId: string,
  fileUrl: string,
  fileName: string,
): Promise<{ success: boolean; message: string }> {
  if (!userId || !documentTypeId || !fileUrl) {
    return { success: false, message: "Dados insuficientes para salvar o documento." };
  }
  try {
    await prisma.userDocument.upsert({
        where: {
            userId_documentTypeId: {
                userId: userId,
                documentTypeId: documentTypeId,
            },
        },
        update: {
            fileUrl: fileUrl,
            fileName: fileName,
            status: 'PENDING_ANALYSIS',
            uploadDate: new Date(),
            rejectionReason: null, // Clear reason on re-upload
        },
        create: {
            userId: userId,
            documentTypeId: documentTypeId,
            fileUrl: fileUrl,
            fileName: fileName,
            status: 'PENDING_ANALYSIS',
            uploadDate: new Date(),
        }
    });

    // Check if all required documents are now submitted
    const requiredDocs = await prisma.documentType.findMany({ where: { isRequired: true }});
    const userDocs = await prisma.userDocument.findMany({ where: { userId }});
    const submittedRequiredDocs = requiredDocs.every(reqDoc => 
        userDocs.some(userDoc => userDoc.documentTypeId === reqDoc.id && userDoc.status !== 'NOT_SENT' && userDoc.status !== 'REJECTED')
    );

    if (submittedRequiredDocs) {
        await prisma.user.update({
            where: { id: userId },
            data: { habilitationStatus: 'PENDING_ANALYSIS' }
        });
    }

    revalidatePath('/dashboard/documents');
    return { success: true, message: "Documento salvo para análise."};
  } catch (error: any) {
    console.error("Error saving user document:", error);
    return { success: false, message: `Falha ao salvar documento: ${error.message}`};
  }
}
