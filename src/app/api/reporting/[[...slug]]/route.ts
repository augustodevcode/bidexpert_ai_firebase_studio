import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: Request) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Dados de exemplo para o tour
    const tourSteps = [
      {
        target: '.toolbar',
        content: 'Esta é a barra de ferramentas. Adicione elementos ao seu relatório a partir daqui.',
      },
      {
        target: '.design-surface',
        content: 'Arraste e solte elementos nesta área para construir seu relatório.',
      },
      {
        target: '.properties-panel',
        content: 'Selecione um elemento para ver e editar suas propriedades aqui.',
      },
    ];

    return NextResponse.json(tourSteps);
  } catch (error) {
    console.error('Erro ao processar a requisição de relatórios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Adicione outros métodos HTTP conforme necessário (POST, PUT, DELETE, etc.)
export const dynamic = 'force-dynamic';