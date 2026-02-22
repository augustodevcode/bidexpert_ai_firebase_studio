// src/app/api/upload/route.ts
/**
 * @fileoverview Rota de API para o upload de arquivos de mídia.
 * Usa o StorageAdapter (LocalStorageAdapter em dev, VercelBlobAdapter em produção).
 * Em dev: salva em public/uploads/. Em Vercel: salva no Vercel Blob com prefixo de ambiente.
 */
import { NextRequest, NextResponse } from 'next/server';
import { MediaService } from '@/services/media.service';
import { getStorageAdapter } from '@/lib/storage';
import type { MediaItem } from '@/types';
import path from 'path';

export const dynamic = 'force-dynamic';

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const uploadPath = formData.get('path') as string || 'media';
    const userId = formData.get('userId') as string | null;
    const judicialProcessId = formData.get('judicialProcessId') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nenhum arquivo fornecido' },
        { status: 400 }
      );
    }
    
    if (!userId) {
        return NextResponse.json(
            { success: false, message: 'Usuário não autenticado. O ID do usuário é obrigatório.'},
            { status: 401 }
        );
    }
    
    const mediaService = new MediaService();
    const storage = getStorageAdapter(request.headers.get('host'));
    const uploadedItems: Partial<MediaItem>[] = [];
    const uploadErrors: { fileName: string; message: string }[] = [];
    const publicUrls: string[] = [];

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

        let uploadResult: { url: string; storagePath: string };
        try {
          uploadResult = await storage.upload(buffer, file.name, uploadPath, file.type);
        } catch (storageErr) {
          uploadErrors.push({ fileName: file.name, message: `Falha no storage: ${String(storageErr)}` });
          continue;
        }

        const { url: publicUrl, storagePath: storedPath } = uploadResult;
        publicUrls.push(publicUrl);

        const itemData: Partial<Omit<MediaItem, 'id'>> = {
            fileName: file.name,
            storagePath: storedPath,
            title: path.basename(file.name, path.extname(file.name)),
            altText: path.basename(file.name, path.extname(file.name)),
            mimeType: file.type,
            sizeBytes: file.size,
            dataAiHint: 'upload usuario',
            judicialProcessId: judicialProcessId || undefined,
        };
        
        const createResult = await mediaService.createMediaItem(itemData, publicUrl, userId);
        if (createResult.success && createResult.item) {
            uploadedItems.push(createResult.item);
        } else {
            uploadErrors.push({ fileName: file.name, message: createResult.message });
        }
    }
    
    let message = '';
    if (publicUrls.length > 0) {
      message += `${publicUrls.length} arquivo(s) enviado(s) com sucesso. `;
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
