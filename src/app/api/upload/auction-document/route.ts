/**
 * @fileoverview Upload dedicado para documentos de leilão com persistência em storage sem acoplar à biblioteca de mídia.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage';
import { getSession } from '@/server/lib/session';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, message: 'Usuário não autenticado.' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ success: false, message: 'Nenhum arquivo foi enviado.' }, { status: 400 });
    }

    const storage = getStorageAdapter(request.headers.get('host'));
    const documents: Array<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }> = [];
    const errors: Array<{ fileName: string; message: string }> = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push({ fileName: file.name, message: `Arquivo excede ${MAX_FILE_SIZE_MB}MB.` });
        continue;
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        errors.push({ fileName: file.name, message: `Tipo '${file.type}' não permitido.` });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');

      try {
        const uploadResult = await storage.upload(buffer, safeName, 'auction-documents', file.type);
        documents.push({
          fileName: file.name,
          fileUrl: uploadResult.url,
          fileSize: file.size,
          mimeType: file.type,
        });
      } catch (error) {
        errors.push({ fileName: file.name, message: `Erro durante upload: ${(error as Error).message}` });
      }
    }

    if (!documents.length) {
      return NextResponse.json({ success: false, message: 'Nenhum documento pôde ser enviado.', errors }, { status: 400 });
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: `${documents.length} documento(s) enviado(s) com sucesso.${errors.length ? ` ${errors.length} falharam.` : ''}`,
      documents,
      errors: errors.length ? errors : undefined,
    }, { status: errors.length ? 207 : 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: `Erro no servidor: ${(error as Error).message}` }, { status: 500 });
  }
}