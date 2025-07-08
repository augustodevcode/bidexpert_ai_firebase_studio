// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminInitialized } from '@/lib/firebase/admin';
import { prisma } from '@/lib/prisma';
import type { MediaItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { revalidatePath } from 'next/cache';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 
  'image/png', 
  'image/webp', 
  'image/gif', 
  'application/pdf',
  'image/svg+xml'
];

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, message: 'Content-Type deve ser multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nenhum arquivo fornecido' },
        { status: 400 }
      );
    }

    const { storage, error: storageError } = ensureAdminInitialized();
    if (!storage || storageError) {
        return NextResponse.json({ success: false, message: `Storage service not initialized: ${storageError?.message}` }, { status: 500 });
    }

    const uploadedItems: MediaItem[] = [];
    const uploadErrors: { fileName: string; message: string }[] = [];

    for (const file of files) {
      let storagePath: string | undefined = undefined;
      try {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          uploadErrors.push({ 
            fileName: file.name, 
            message: `Arquivo excede ${MAX_FILE_SIZE_MB}MB (${(file.size / 1024 / 1024).toFixed(2)}MB)` 
          });
          continue;
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          uploadErrors.push({ 
            fileName: file.name, 
            message: `Tipo '${file.type}' não permitido` 
          });
          continue;
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const uniqueFilename = `${uuidv4()}-${sanitizedFileName}`;
        storagePath = `media/${uniqueFilename}`;

        const fileRef = storage.bucket().file(storagePath);
        
        await fileRef.save(fileBuffer, {
            metadata: { contentType: file.type }
        });
        await fileRef.makePublic();
        const publicUrl = fileRef.publicUrl();

        const newItem = await prisma.mediaItem.create({
            data: {
                id: `media-${uuidv4()}`,
                fileName: file.name,
                storagePath: storagePath,
                title: path.basename(file.name, path.extname(file.name)),
                altText: path.basename(file.name, path.extname(file.name)),
                mimeType: file.type,
                sizeBytes: file.size,
                urlOriginal: publicUrl,
                urlThumbnail: publicUrl,
                urlMedium: publicUrl,
                urlLarge: publicUrl,
                linkedLotIds: [],
                dataAiHint: (formData.get(`dataAiHint_${file.name}`) as string) || 'upload usuario',
                uploadedBy: 'admin_placeholder',
            }
        });
        
        uploadedItems.push(newItem as unknown as MediaItem);
      } catch (error: any) {
        // Attempt to clean up orphaned file in storage if DB write fails
        if (storagePath) {
          await storage.bucket().file(storagePath).delete().catch(e => console.warn(`Failed to cleanup orphaned file ${storagePath}`, e));
        }
        uploadErrors.push({ 
          fileName: file.name, 
          message: error.message || 'Erro desconhecido durante o processamento do arquivo.'
        });
      }
    }
    
    let message = '';
    if (uploadedItems.length > 0) {
      message += `${uploadedItems.length} arquivo(s) enviado(s) com sucesso. `;
      revalidatePath('/admin/media');
      console.log("[API Upload] Revalidated path /admin/media");
    }
    if (uploadErrors.length > 0) {
      message += `${uploadErrors.length} arquivo(s) falharam.`;
    }

    const success = uploadErrors.length === 0 && uploadedItems.length > 0;
    const statusCode = success ? 200 : (uploadedItems.length > 0 ? 207 : 400); // 207 Multi-Status

    return NextResponse.json({
      success,
      message: message.trim(),
      items: uploadedItems,
      errors: uploadErrors.length > 0 ? uploadErrors : undefined
    }, { status: statusCode });

  } catch (error: any) {
    console.error('[API Upload Route Handler] Erro geral:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Erro no servidor: ${error.message}`,
        errors: [{ fileName: 'Erro Geral', message: error.message }]
      },
      { status: 500 }
    );
  }
}
