// src/app/api/reports/extract-text/route.ts
/**
 * @fileoverview API Route para extração de texto de documentos Word (.docx) e PDF.
 * Utiliza mammoth para DOCX e pdf-parse para PDF.
 * O texto extraído é usado pelo painel de IA para gerar templates Handlebars.
 *
 * POST /api/reports/extract-text
 * Content-Type: multipart/form-data
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 10 MB' },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';
    const mimeType = file.type;

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.doc')
    ) {
      // Extract text from Word document using mammoth
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (
      mimeType === 'application/pdf' ||
      file.name.endsWith('.pdf')
    ) {
      // Extract text from PDF using pdf-parse
      // pdf-parse uses CJS export; cast to a callable to satisfy TypeScript
      const pdfParseModule = await import('pdf-parse' as string);
      const pdfParse = (pdfParseModule.default ?? pdfParseModule) as (
        buffer: Buffer,
        options?: { max?: number }
      ) => Promise<{ text: string }>;
      const result = await pdfParse(buffer, {
        max: 0, // Parse all pages
      });
      extractedText = result.text;
    } else if (mimeType === 'text/plain' || file.name.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8');
    } else {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Use .docx, .doc, .pdf ou .txt' },
        { status: 415 }
      );
    }

    // Trim excessive whitespace and limit size
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .substring(0, 50_000); // Limit to 50k chars to avoid token overflow

    return NextResponse.json({
      success: true,
      text: extractedText,
      charCount: extractedText.length,
      fileName: file.name,
    });
  } catch (error) {
    console.error('[Extract Text Route] Erro:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao extrair texto do documento';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
