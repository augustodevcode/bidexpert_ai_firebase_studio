// src/ai/flows/extract-process-data-flow.ts
'use server';

/**
 * @fileOverview A Genkit flow to extract structured data from judicial process documents.
 * This flow takes an image of a document and uses AI to parse and return key information
 * such as process number, parties involved, and court details.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { ProcessPartyType } from '@/types';

// Define party types for Zod schema validation
const partyTypes: [ProcessPartyType, ...ProcessPartyType[]] = [
  'AUTOR', 'REU', 'ADVOGADO_AUTOR', 'ADVOGADO_REU', 'JUIZ', 'ESCRIVAO', 'PERITO', 'ADMINISTRADOR_JUDICIAL', 'TERCEIRO_INTERESSADO', 'OUTRO'
];

// --- Input Schema ---
const ExtractProcessDataInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "An image of the judicial document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractProcessDataInput = z.infer<typeof ExtractProcessDataInputSchema>;


// --- Output Schema ---
const ExtractedPartySchema = z.object({
    name: z.string().describe("Nome completo da parte ou do advogado."),
    partyType: z.enum(partyTypes).describe("O tipo/papel da parte no processo (ex: AUTOR, REU).")
});

const ExtractProcessDataOutputSchema = z.object({
  processNumber: z.string().optional().describe("O número único do processo, no formato 0000000-00.0000.0.00.0000."),
  courtName: z.string().optional().describe("O nome do tribunal (ex: Tribunal de Justiça de São Paulo)."),
  districtName: z.string().optional().describe("O nome da comarca (ex: Comarca de Campinas)."),
  branchName: z.string().optional().describe("O nome da vara (ex: 1ª Vara Cível)."),
  parties: z.array(ExtractedPartySchema).optional().describe("Uma lista das partes envolvidas no processo e seus respectivos papéis."),
  rawText: z.string().optional().describe("O texto completo extraído (OCR) do documento para verificação."),
});
export type ExtractProcessDataOutput = z.infer<typeof ExtractProcessDataOutputSchema>;


// --- Exported Function ---
export async function extractProcessData(input: ExtractProcessDataInput): Promise<ExtractProcessDataOutput> {
  return extractProcessDataFlow(input);
}


// --- Genkit Prompt ---
const extractProcessDataPrompt = ai.definePrompt({
    name: 'extractProcessDataPrompt',
    input: { schema: ExtractProcessDataInputSchema },
    output: { schema: ExtractProcessDataOutputSchema },
    prompt: `Você é um assistente jurídico especialista em análise de documentos de processos judiciais brasileiros. Sua tarefa é analisar a imagem de um documento fornecida e extrair as seguintes informações de forma estruturada.

Documento para análise:
{{media url=documentDataUri}}

Por favor, extraia os seguintes campos do documento:
- **processNumber**: O número do processo no formato CNJ.
- **courtName**: O nome do Tribunal.
- **districtName**: O nome da Comarca.
- **branchName**: O nome da Vara.
- **parties**: Uma lista de todas as partes (autores, réus, advogados) mencionadas, identificando o nome e o tipo de cada uma.
- **rawText**: Transcreva todo o texto contido na imagem do documento.

Se alguma informação não estiver claramente visível ou presente no documento, deixe o campo correspondente em branco. Preste muita atenção aos detalhes e formate a saída estritamente como o JSON solicitado.
`,
});

// --- Genkit Flow ---
const extractProcessDataFlow = ai.defineFlow(
  {
    name: 'extractProcessDataFlow',
    inputSchema: ExtractProcessDataInputSchema,
    outputSchema: ExtractProcessDataOutputSchema,
  },
  async (input) => {
    const {output} = await extractProcessDataPrompt.generate({
        input,
    });
    
    // Return the structured output from the LLM
    return output!;
  }
);
