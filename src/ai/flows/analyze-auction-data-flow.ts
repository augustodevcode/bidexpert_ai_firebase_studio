// src/ai/flows/analyze-auction-data-flow.ts
'use server';

/**
 * @fileOverview A Genkit flow to analyze auction performance data.
 * This flow takes a summary of auction data and uses an AI model to generate
 * a textual analysis with strategic insights and recommendations.
 *
 * - analyzeAuctionData - The main function to trigger the analysis.
 * - AnalyzeAuctionDataInput - The input type for the analysis function.
 * - AnalyzeAuctionDataOutput - The return type, containing the AI-generated text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { AuctionPerformanceData } from '@/app/admin/auctions/analysis/actions';

// --- Input Schema ---
export const AnalyzeAuctionDataInputSchema = z.object({
  performanceData: z.array(z.any()).describe('An array of auction performance objects, where each object contains metrics like title, status, totalLots, lotsSoldCount, totalRevenue, averageTicket, and salesRate.'),
});
export type AnalyzeAuctionDataInput = z.infer<typeof AnalyzeAuctionDataInputSchema>;


// --- Output Schema ---
export const AnalyzeAuctionDataOutputSchema = z.object({
  analysis: z.string().describe("A comprehensive textual analysis of the provided auction data, highlighting key trends, identifying top-performing auctions, pointing out potential areas for improvement, and providing actionable recommendations for the business strategy."),
});
export type AnalyzeAuctionDataOutput = z.infer<typeof AnalyzeAuctionDataOutputSchema>;


// --- Exported Function ---
export async function analyzeAuctionData(input: AnalyzeAuctionDataInput): Promise<AnalyzeAuctionDataOutput> {
  return analyzeAuctionDataFlow(input);
}


// --- Genkit Prompt ---
const analyzeAuctionDataPrompt = ai.definePrompt({
    name: 'analyzeAuctionDataPrompt',
    input: { schema: AnalyzeAuctionDataInputSchema },
    output: { schema: AnalyzeAuctionDataOutputSchema },
    prompt: `Você é um consultor de negócios especialista em leilões online. Sua tarefa é analisar um conjunto de dados sobre a performance de vários leilões e gerar um relatório conciso com insights e recomendações para a diretoria.

Dados para análise (JSON):
{{{jsonStringify performanceData}}}

Baseado nos dados fornecidos, por favor, gere um relatório de análise que inclua:
1.  **Resumo Geral:** Um parágrafo curto resumindo a saúde geral dos leilões (faturamento total, taxa de venda média, etc.).
2.  **Pontos Fortes:** Identifique 2-3 pontos positivos notáveis (ex: leilões com alta taxa de venda, categorias de destaque implícitas pelos títulos, etc.).
3.  **Pontos de Atenção:** Identifique 2-3 áreas que podem precisar de atenção (ex: leilões com faturamento baixo apesar do número de lotes, baixa taxa de venda geral, etc.).
4.  **Recomendações Estratégicas:** Forneça 2 recomendações acionáveis para a equipe. Por exemplo: "Investigar o mix de produtos no leilão X que teve baixa performance" ou "Replicar a estratégia de marketing do leilão Y, que teve faturamento alto".

Seja direto, profissional e foque em insights que possam levar a decisões de negócio. Formate a saída como um único texto corrido com parágrafos.
`,
});


// --- Genkit Flow ---
const analyzeAuctionDataFlow = ai.defineFlow(
  {
    name: 'analyzeAuctionDataFlow',
    inputSchema: AnalyzeAuctionDataInputSchema,
    outputSchema: AnalyzeAuctionDataOutputSchema,
  },
  async (input) => {
    
    const { output } = await analyzeAuctionDataPrompt.generate({
      input: {
        performanceData: input.performanceData.slice(0, 50), // Limit input tokens
      },
      helpers: {
        jsonStringify: (data: any) => JSON.stringify(data, null, 2),
      }
    });
    
    return output!;
  }
);
