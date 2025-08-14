// src/ai/flows/analyze-listing-quality-flow.ts
'use server';

/**
 * @fileOverview Um fluxo Genkit de exemplo para analisar a qualidade de um anúncio de leilão.
 * Este fluxo demonstra como os parâmetros são definidos e usados.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// 1. DEFINIÇÃO DOS PARÂMETROS DE ENTRADA COM ZOD
const AnalyzeListingQualityInputSchema = z.object({
  listingTitle: z.string().describe('O título do anúncio do leilão.'),
  listingDescription: z.string().describe('A descrição completa do item no leilão.'),
  itemCategory: z.string().describe('A categoria à qual o item pertence (ex: Veículos, Imóveis).'),
});
export type AnalyzeListingQualityInput = z.infer<typeof AnalyzeListingQualityInputSchema>;


// 2. DEFINIÇÃO DA ESTRUTURA DE SAÍDA ESPERADA COM ZOD
const AnalyzeListingQualityOutputSchema = z.object({
  qualityScore: z.number().min(0).max(100).describe("Uma pontuação de 0 a 100 para a qualidade geral do anúncio."),
  positivePoints: z.array(z.string()).describe("Uma lista de pontos fortes do anúncio."),
  improvementSuggestions: z.array(z.string()).describe("Uma lista de sugestões claras e acionáveis para melhorar o anúncio."),
});
export type AnalyzeListingQualityOutput = z.infer<typeof AnalyzeListingQualityOutputSchema>;


// 3. FUNÇÃO EXPORTADA QUE A APLICAÇÃO CHAMA
export async function analyzeListingQuality(input: AnalyzeListingQualityInput): Promise<AnalyzeListingQualityOutput> {
  // Esta função serve como um invólucro limpo para o fluxo Genkit.
  return analyzeListingQualityFlow(input);
}


// 4. DEFINIÇÃO DO PROMPT DA IA, USANDO OS SCHEMAS
const listingAnalysisPrompt = ai.definePrompt({
    name: 'listingAnalysisPrompt',
    input: { schema: AnalyzeListingQualityInputSchema },
    output: { schema: AnalyzeListingQualityOutputSchema },
    prompt: `Você é um especialista em marketing para leilões. Analise o seguinte anúncio e forneça uma pontuação de qualidade de 0 a 100, juntamente com pontos positivos e sugestões de melhoria.

    - **Título:** {{{listingTitle}}}
    - **Descrição:** {{{listingDescription}}}
    - **Categoria:** {{{itemCategory}}}

    Considere a clareza, poder de atração, detalhes técnicos e apelo emocional do texto. Forneça uma análise concisa e útil.
    `,
});


// 5. DEFINIÇÃO DO FLUXO GENKIT QUE ORQUESTRA A LÓGICA
const analyzeListingQualityFlow = ai.defineFlow(
  {
    name: 'analyzeListingQualityFlow',
    inputSchema: AnalyzeListingQualityInputSchema,
    outputSchema: AnalyzeListingQualityOutputSchema,
  },
  async (input) => {
    // O fluxo recebe o input, chama o prompt e retorna o output estruturado.
    const { output } = await listingAnalysisPrompt.generate({ input });
    return output!;
  }
);
