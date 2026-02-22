/**
 * @fileoverview API route para salvar imagem editada (crop, rotate, ajustes).
 * Recebe Blob via FormData, salva via storage adapter, cria/atualiza MediaItem.
 * export const dynamic = 'force-dynamic' (obrigat├│rio para Vercel).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mode = formData.get('mode') as string; // 'copy' | 'overwrite'
    const originalId = formData.get('originalId') as string | null;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const storage = getStorageAdapter();
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg';
    const fileName = `edited-${uuidv4()}${ext}`;

    // Upload to storage — ordem: (buffer, fileName, uploadPath, mimeType)
    const { url, storagePath } = await storage.upload(buffer, fileName, 'media', file.type || 'image/png');

    if (mode === 'overwrite' && originalId) {
      // Overwrite: update existing MediaItem
      const existing = await prisma.mediaItem.findUnique({
        where: { id: BigInt(originalId) },
      });

      if (existing) {
        // Delete old file from storage
        try {
          await storage.delete(existing.storagePath);
        } catch {
          // Old file may not exist
        }

        const updated = await prisma.mediaItem.update({
          where: { id: BigInt(originalId) },
          data: {
            urlOriginal: url,
            storagePath,
            sizeBytes: buffer.length,
            fileName,
            mimeType: file.type || 'image/png',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Imagem substitu├¡da com sucesso.',
          item: {
            ...updated,
            id: String(updated.id),
            uploadedByUserId: updated.uploadedByUserId ? String(updated.uploadedByUserId) : null,
            judicialProcessId: updated.judicialProcessId ? String(updated.judicialProcessId) : null,
            tenantId: updated.tenantId ? String(updated.tenantId) : null,
          },
        });
      }
    }

    // Create new MediaItem (copy mode or original not found)
    const newItem = await prisma.mediaItem.create({
      data: {
        fileName,
        storagePath,
        urlOriginal: url,
        mimeType: file.type || 'image/png',
        sizeBytes: buffer.length,
        uploadedAt: new Date(),
        ...(userId ? { uploadedByUserId: BigInt(userId) } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: mode === 'copy' ? 'C├│pia editada salva.' : 'Nova m├¡dia criada.',
      item: {
        ...newItem,
        id: String(newItem.id),
        uploadedByUserId: newItem.uploadedByUserId ? String(newItem.uploadedByUserId) : null,
        judicialProcessId: newItem.judicialProcessId ? String(newItem.judicialProcessId) : null,
        tenantId: newItem.tenantId ? String(newItem.tenantId) : null,
      },
    });
  } catch (error) {
    console.error('[API /media/edit] Error:', error);
    return NextResponse.json(
      { error: 'Falha ao salvar imagem editada.', details: String(error) },
      { status: 500 }
    );
  }
}
