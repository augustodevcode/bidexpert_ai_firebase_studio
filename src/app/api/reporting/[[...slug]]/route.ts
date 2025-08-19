// src/app/api/reporting/[[...slug]]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { reportDesignerApi } from '@/services/reporting/report-designer-api';
import logger from '@/lib/logger';

/**
 * Rota de API "Catch-all" para lidar com todas as solicitações 
 * do componente DevExpress Report Designer.
 *
 * O Report Designer faz várias chamadas para diferentes sub-rotas sob
 * o endpoint configurado (neste caso, /api/reporting). Este manipulador
 * captura todas essas chamadas e as encaminha para a lógica de serviço apropriada.
 *
 * @param {NextRequest} req - O objeto da requisição Next.js.
 * @returns {Promise<NextResponse>} A resposta gerada pelo manipulador da DevExpress.
 */
async function handler(req: NextRequest): Promise<NextResponse> {
    try {
        // Log da requisição recebida para fins de depuração
        logger.info(`[Report API] Recebida requisição: ${req.method} ${req.url}`);
        
        // Converte a requisição do Next.js para um formato que a API da DevExpress entende
        // e aguarda o processamento.
        const response = await reportDesignerApi(req);

        // Retorna a resposta da API da DevExpress diretamente para o cliente.
        return response;

    } catch (error: any) {
        // Log de qualquer erro que ocorra durante o processamento
        logger.error('[Report API] Erro ao processar a requisição do Report Designer:', error);

        // Retorna uma resposta de erro genérica para o cliente
        return new NextResponse(
            JSON.stringify({ error: "Erro interno ao processar a requisição de relatório.", details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// Exporta o manipulador para os métodos GET e POST, que são os utilizados pelo Report Designer.
export { handler as GET, handler as POST };
