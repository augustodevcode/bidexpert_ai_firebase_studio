
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminInitialized } from '@/lib/firebase/admin';
import { getDatabaseAdapter } from '@/lib/database/index';
import type { MediaItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

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
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const uploadPath = formData.get('path') as string || 'media';
    const userId = formData.get('userId') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nenhum arquivo fornecido' },
        { status: 400 }
      );
    }
    
    const uploadedItems: Partial<MediaItem>[] = [];
    const uploadErrors: { fileName: string; message: string }[] = [];
    const publicUrls: string[] = [];

    // Define and ensure the upload directory exists
    const relativeUploadDir = path.join('public', 'uploads', uploadPath);
    const absoluteUploadDir = path.join(process.cwd(), relativeUploadDir);

    if (!existsSync(absoluteUploadDir)) {
        await mkdir(absoluteUploadDir, { recursive: true });
    }

    for (const file of files) {
       if (file.size > MAX_FILE_SIZE_BYTES) {
          uploadErrors.push({ fileName: file.name, message: `Arquivo excede ${MAX_FILE_SIZE_MB}MB.` });
          continue;
        }
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          uploadErrors.push({ fileName: file.name, message: `Tipo '${file.type}' não permitido.` });
          continue;
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const uniqueFilename = `${uuidv4()}-${sanitizedFileName}`;
        
        await writeFile(path.join(absoluteUploadDir, uniqueFilename), buffer);
        
        const publicUrl = path.join('/uploads', uploadPath, uniqueFilename).replace(/\\/g, '/');
        publicUrls.push(publicUrl);

        if (uploadPath === 'media') {
            const db = await getDatabaseAdapter();
            const itemData: Omit<MediaItem, 'id' | 'uploadedAt'> = {
                fileName: file.name,
                storagePath: publicUrl,
                title: path.basename(file.name, path.extname(file.name)),
                altText: path.basename(file.name, path.extname(file.name)),
                mimeType: file.type,
                sizeBytes: file.size,
                urlOriginal: publicUrl,
                urlThumbnail: publicUrl, 
                urlMedium: publicUrl,
                urlLarge: publicUrl,
                linkedLotIds: [],
                dataAiHint: 'upload usuario',
                uploadedBy: userId || 'system-seed',
            };
            const createResult = await db.createMediaItem(itemData, publicUrl, userId || 'system-seed');
            if (createResult.success && createResult.item) {
                uploadedItems.push(createResult.item);
            } else {
                uploadErrors.push({ fileName: file.name, message: createResult.message });
            }
        }
    }
    
    let message = '';
    if (publicUrls.length > 0) {
      message += `${publicUrls.length} arquivo(s) enviado(s) com sucesso. `;
      if (uploadPath === 'media') {
        revalidatePath('/admin/media');
      }
    }
    if (uploadErrors.length > 0) {
      message += `${uploadErrors.length} arquivo(s) falharam.`;
    }

    const success = uploadErrors.length === 0;
    const statusCode = success ? 200 : (publicUrls.length > 0 ? 207 : 400);

    return NextResponse.json({
      success,
      message,
      items: uploadedItems,
      urls: publicUrls,
      errors: uploadErrors.length > 0 ? uploadErrors : undefined,
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
