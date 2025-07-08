// src/app/api/upload/document/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminInitialized } from '@/lib/firebase/admin';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// This is a dedicated route for user document uploads.
// It ensures that files are stored in a user-specific directory.

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const docType = formData.get('docType') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'Nenhum arquivo fornecido.' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ success: false, message: 'ID do usuário não fornecido.' }, { status: 400 });
    }
    if (!docType) {
        return NextResponse.json({ success: false, message: 'Tipo do documento não fornecido.' }, { status: 400 });
    }

    // Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ success: false, message: `Arquivo excede ${MAX_FILE_SIZE_MB}MB.` }, { status: 413 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ success: false, message: `Tipo de arquivo '${file.type}' não permitido.` }, { status: 415 });
    }

    const { storage, error: storageError } = ensureAdminInitialized();
    if (!storage || storageError) {
        return NextResponse.json({ success: false, message: `Storage service not initialized: ${storageError?.message}` }, { status: 500 });
    }
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const sanitizedDocType = docType.replace(/[^a-zA-Z0-9-_]/g, '_');
    const uniqueFilename = `${sanitizedDocType}-${uuidv4()}${path.extname(file.name)}`;

    // Define user-specific path
    const storagePath = `documents/${userId}/${uniqueFilename}`;
    const fileRef = storage.bucket().file(storagePath);
    
    // Upload to storage
    await fileRef.save(fileBuffer, {
        metadata: { contentType: file.type }
    });
    await fileRef.makePublic();
    const publicUrl = fileRef.publicUrl();

    // This route's primary job is to store the file. The association logic
    // might happen in a separate step or can be done here if needed.
    // For now, we just return the URL.
    
    return NextResponse.json({
      success: true,
      message: 'Documento enviado com sucesso!',
      publicUrl,
      storagePath: storagePath
    });

  } catch (error: any) {
    console.error('[API upload/document] Erro geral:', error);
    return NextResponse.json({ success: false, message: `Erro no servidor: ${error.message}` }, { status: 500 });
  }
}
