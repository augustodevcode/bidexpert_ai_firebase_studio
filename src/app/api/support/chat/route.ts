import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { message, userId, context } = body;

    // Save chat log to database
    const chatLog = await prisma.iTSM_ChatLog.create({
      data: {
        userId: BigInt(userId),
        messages: [
          {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
          },
        ],
        context: context || {},
        sessionId: `session-${Date.now()}`,
      },
    });

    // Simulate AI response (replace with actual AI integration)
    const aiResponse = generateAIResponse(message);

    // Update chat log with AI response
    await prisma.iTSM_ChatLog.update({
      where: { id: chatLog.id },
      data: {
        messages: [
          ...(chatLog.messages as any[]),
          {
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    return NextResponse.json({ 
      response: aiResponse,
      chatLogId: chatLog.id.toString(),
    });
  } catch (error) {
    console.error('Erro no chat:', error);
    return NextResponse.json({ error: 'Erro ao processar mensagem' }, { status: 500 });
  }
}

function generateAIResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Simple keyword-based responses (replace with actual AI)
  if (lowerMessage.includes('lance') || lowerMessage.includes('bid')) {
    return 'Para dar um lance, navegue até o lote desejado e clique no botão "Fazer Lance". Você precisará estar habilitado no leilão antes de dar lances. Posso ajudar com mais alguma coisa?';
  }

  if (lowerMessage.includes('habilita') || lowerMessage.includes('cadastro')) {
    return 'Para se habilitar em um leilão, acesse a página do leilão e clique em "Habilitar-se". Você precisará enviar documentos como RG, CPF e comprovante de residência. A análise geralmente leva até 24 horas. Precisa de mais informações?';
  }

  if (lowerMessage.includes('pagamento') || lowerMessage.includes('pagar')) {
    return 'Aceitamos as seguintes formas de pagamento: PIX, transferência bancária, boleto e cartão de crédito/débito. O prazo e condições podem variar de acordo com cada leilão. Gostaria de mais detalhes sobre alguma forma específica?';
  }

  if (lowerMessage.includes('documento') || lowerMessage.includes('doc')) {
    return 'Os documentos necessários são: RG, CPF, comprovante de residência atualizado (últimos 90 dias) e, em alguns casos, documentos complementares. Você pode enviá-los através do seu perfil. Posso ajudar com mais alguma dúvida?';
  }

  return 'Obrigado pela sua mensagem! Para questões mais específicas, recomendo abrir um ticket de suporte através do botão "Reportar Issue". Nossa equipe especializada poderá ajudá-lo melhor. Há algo mais em que posso ajudar agora?';
}
