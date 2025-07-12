// src/app/api/upload/document/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { getDatabaseAdapter } from '@/lib/database/index';
import { revalidatePath } from 'next/cache';

// This is a dedicated route for user document uploads.
// It ensures that files are stored in a user-specific directory and updates the database.

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
    const documentTypeId = formData.get('documentTypeId') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'Nenhum arquivo fornecido.' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ success: false, message: 'ID do usuário não fornecido.' }, { status: 400 });
    }
    if (!docType || !documentTypeId) {
        return NextResponse.json({ success: false, message: 'Tipo do documento não fornecido.' }, { status: 400 });
    }

    // Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ success: false, message: `Arquivo excede ${MAX_FILE_SIZE_MB}MB.` }, { status: 413 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ success: false, message: `Tipo de arquivo '${file.type}' não permitido.` }, { status: 415 });
    }

    // In a real app with cloud storage, this is where you'd upload the file to a bucket.
    // For local dev with this adapter, we just simulate a public URL.
    const sanitizedDocType = docType.replace(/[^a-zA-Z0-9-_]/g, '_');
    const uniqueFilename = `${sanitizedDocType}-${uuidv4()}${path.extname(file.name)}`;
    const publicUrl = `/uploads/documents/${userId}/${uniqueFilename}`;

    // Now, save the document record in the database
    const db = await getDatabaseAdapter();
    // @ts-ignore
    if (db.saveUserDocument) {
      // @ts-ignore
      await db.saveUserDocument(userId, documentTypeId, publicUrl, file.name);
      revalidatePath('/dashboard/documents');
      revalidatePath(`/admin/habilitations/${userId}`);
    } else {
       console.warn("db.saveUserDocument is not implemented for the current adapter.");
    }
    
    return NextResponse.json({
      success: true,
      message: 'Documento enviado com sucesso!',
      publicUrl: publicUrl,
      storagePath: publicUrl // For local, publicUrl and storagePath are the same
    });

  } catch (error: any) {
    console.error('[API upload/document] Erro geral:', error);
    return NextResponse.json({ success: false, message: `Erro no servidor: ${error.message}` }, { status: 500 });
  }
}
