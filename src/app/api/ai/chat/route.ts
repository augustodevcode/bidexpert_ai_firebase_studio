/**
 * src/app/api/ai/chat/route.ts
 * Endpoint REST para o chatbot Q&A da plataforma BidExpert.
 *
 * POST /api/ai/chat
 * Body: { message: string, history?: { role: string, content: string }[], stream?: boolean }
 *
 * Requer autenticação. Retorna resposta do assistente AI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { askPlatformQuestion, askPlatformQuestionStream, PlatformQAInputSchema } from '@/ai/flows/platform-qa-flow';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const RequestBodySchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .max(20)
    .optional()
    .default([]),
  stream: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Não autenticado. Faça login para usar o assistente.' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Corpo da requisição inválido. Esperado JSON.' },
      { status: 400 }
    );
  }

  const parseResult = RequestBodySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { message, history, stream } = parseResult.data;

  // Get tenant name for personalized system prompt
  const tenantName =
    (session as { user?: { tenantName?: string } }).user?.tenantName ??
    'BidExpert';

  const input = PlatformQAInputSchema.parse({ message, history, tenantName });

  if (stream) {
    // Streaming response via Server-Sent Events
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of askPlatformQuestionStream(input)) {
            const data = JSON.stringify({ chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Erro ao gerar resposta.';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  // Non-streaming response
  try {
    const result = await askPlatformQuestion(input);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/ai/chat] Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Erro interno ao gerar resposta.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
