// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage';
import { getDatabaseAdapter } from '@/lib/database';
import type { MediaItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';

const MAX_FILE_SIZE_MB = 100000;
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

    const storage = await getStorageAdapter();
    const db = await getDatabaseAdapter();

    const uploadedItems: MediaItem[] = [];
    const uploadErrors: { fileName: string; message: string }[] = [];

    for (const file of files) {
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
        
        const { publicUrl, storagePath } = await storage.upload(
          uniqueFilename,
          file.type,
          fileBuffer
        );

        let thumbnailUrl = publicUrl;
        let thumbnailStoragePath = storagePath; // Assume same path if no thumb generated

        if (file.type.startsWith('image/')) {
          try {
            const thumbnailBuffer = await sharp(fileBuffer)
              .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
              .toBuffer();

            const thumbnailFilename = `thumb-${uniqueFilename}`;
            const { publicUrl: tnPublicUrl, storagePath: tnStoragePath } = await storage.upload(
              thumbnailFilename,
              file.type, // Keep original MIME type for thumbnail
              thumbnailBuffer
            );
            thumbnailUrl = tnPublicUrl;
            thumbnailStoragePath = tnStoragePath; // Keep track of the thumbnail's own storage path
            console.log(`[API Upload] Thumbnail generated and uploaded: ${thumbnailUrl}`);
          } catch (thumbError: any) {
            console.warn(`[API Upload] Could not generate thumbnail for ${file.name}: ${thumbError.message}. Using original image as thumbnail.`);
            // thumbnailUrl remains publicUrl (original)
            // thumbnailStoragePath remains storagePath (original)
          }
        }
        
        const mediaItemData: Omit<MediaItem, 'id' | 'uploadedAt'> = {
          fileName: file.name,
          storagePath: storagePath, // Store path of the original file
          title: path.basename(file.name, path.extname(file.name)),
          altText: path.basename(file.name, path.extname(file.name)),
          mimeType: file.type,
          sizeBytes: file.size,
          urlOriginal: publicUrl,
          urlThumbnail: thumbnailUrl, // Use the potentially different thumbnail URL
          urlMedium: publicUrl, // For now, medium and large are same as original
          urlLarge: publicUrl,
          linkedLotIds: [],
          dataAiHint: (formData.get(`dataAiHint_${file.name}`) as string) || 'upload usuario',
          uploadedBy: 'admin_placeholder',
          // Note: We are not storing thumbnailStoragePath in MediaItem directly,
          // as delete operations should target the original storagePath,
          // and a more robust system would handle derived images (like thumbs) separately if needed.
          // For now, if the original is deleted, the thumb URL might become invalid if not also deleted.
          // This simple approach assumes thumbnails are "extra" and might not need separate management in DB.
        };
        
        // Pass the original publicUrl to createMediaItem as it might be used for some primary reference
        console.log('[API Upload] Attempting to save MediaItem to DB. Data:', JSON.stringify(mediaItemData, null, 2));
        const dbResult = await db.createMediaItem(mediaItemData, publicUrl, 'admin_placeholder');
        console.log('[API Upload] DB createMediaItem result:', JSON.stringify(dbResult, null, 2));
        
        if (dbResult.success && dbResult.item) {
          uploadedItems.push(dbResult.item);
        } else {
          // If thumbnail was created, we might want to delete it as well.
          if (thumbnailUrl !== publicUrl && thumbnailStoragePath !== storagePath) {
            console.log(`[API Upload] Attempting to delete generated thumbnail due to DB error: ${thumbnailStoragePath}`);
            await storage.delete(thumbnailStoragePath);
          }
          await storage.delete(storagePath);
          throw new Error(dbResult.message || `Falha ao salvar ${file.name} no banco de dados.`);
        }
      } catch (error: any) {
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
    const statusCode = success ? 200 : (uploadedItems.length > 0 ? 207 : 400);

    return NextResponse.json({
      success,
      message: message.trim(),
      items: uploadedItems,
      errors: uploadErrors.length > 0 ? uploadErrors : undefined
    }, { status: statusCode });

  } catch (error: any) {
    console.error('[API Upload Rote Handler] Erro geral:', error);
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
