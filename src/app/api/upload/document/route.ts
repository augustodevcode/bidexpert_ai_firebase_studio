// src/app/api/upload/document/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { prisma } from '@/lib/prisma'; // Use prisma directly for this specific use case
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const documentTypeId = formData.get('documentTypeId') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'Nenhum arquivo fornecido.' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ success: false, message: 'ID do usuário não fornecido.' }, { status: 401 });
    }
    if (!documentTypeId) {
        return NextResponse.json({ success: false, message: 'Tipo do documento não fornecido.' }, { status: 400 });
    }

    // Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ success: false, message: `Arquivo excede ${MAX_FILE_SIZE_MB}MB.` }, { status: 413 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ success: false, message: `Tipo de arquivo '${file.type}' não permitido.` }, { status: 415 });
    }
    
    // Save file physically
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents', userId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueFilename = `${documentTypeId}-${uuidv4()}${path.extname(file.name)}`;
    const filePath = path.join(uploadDir, uniqueFilename);
    const publicUrl = `/uploads/documents/${userId}/${uniqueFilename}`;

    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    // Now, save the document record in the database using Prisma directly
    await prisma.userDocument.upsert({
        where: { userId_documentTypeId: { userId, documentTypeId }},
        update: { fileUrl: publicUrl, fileName: file.name, status: 'PENDING_ANALYSIS', rejectionReason: null },
        create: { userId, documentTypeId, fileUrl: publicUrl, fileName: file.name, status: 'PENDING_ANALYSIS' },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Documento enviado com sucesso!',
      publicUrl: publicUrl,
    });

  } catch (error: any) {
    console.error('[API upload/document] Erro geral:', error);
    return NextResponse.json({ success: false, message: `Erro no servidor: ${error.message}` }, { status: 500 });
  }
}
