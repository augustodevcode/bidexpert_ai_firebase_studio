'use server';

/**
 * @fileoverview Motor de geração de templates de relatórios com IA.
 * Suporta dois providers: Genkit (Google AI) e Ollama (modelos locais).
 * O provider é selecionado via campo `aiProvider` no input ou pela variável
 * de ambiente `AI_PROVIDER` (padrão: 'genkit').
 *
 * Provider Genkit: requer GOOGLEAI_API_KEY
 * Provider Ollama: requer servidor Ollama em execução (configurar OLLAMA_HOST e OLLAMA_MODEL)
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateWithOllama } from '@/lib/ai-providers/ollama-provider';
import type { AIProvider } from '@/lib/ai-providers/types';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum characters allowed in user prompt (enforced by schema and API route). */
const MAX_PROMPT_CHARS = 1000;

/**
 * Maximum characters of extracted document text sent to the AI model.
 * Keeps the AI context window manageable while preserving document structure.
 */
const MAX_DOCUMENT_CONTEXT_CHARS = 8000;

// ============================================================================
// SCHEMAS
// ============================================================================

export const GenerateReportTemplateInputSchema = z.object({
  contextType: z
    .enum(['AUCTION', 'LOT', 'BIDDER', 'COURT_CASE', 'AUCTION_RESULT', 'APPRAISAL_REPORT', 'INVOICE'])
    .describe('Tipo de contexto de dados do relatório'),
  prompt: z
    .string()
    .min(10, 'Descreva o template com pelo menos 10 caracteres')
    .max(MAX_PROMPT_CHARS, `Prompt deve ter no máximo ${MAX_PROMPT_CHARS} caracteres`)
    .describe('Descrição do template a ser gerado pelo usuário'),
  documentText: z
    .string()
    .optional()
    .describe('Texto extraído de documento Word/PDF para análise'),
  tone: z
    .enum(['FORMAL_JURIDICO', 'TECNICO', 'COMERCIAL'])
    .default('FORMAL_JURIDICO')
    .describe('Tom do documento'),
  language: z
    .string()
    .default('pt-BR')
    .describe('Idioma do template'),
  pageSize: z
    .enum(['A4', 'Letter', 'Legal'])
    .default('A4')
    .describe('Tamanho da página'),
  orientation: z
    .enum(['portrait', 'landscape'])
    .default('portrait')
    .describe('Orientação da página'),
  aiProvider: z
    .enum(['genkit', 'ollama'])
    .optional()
    .describe('Provider de IA: "genkit" (Google AI) ou "ollama" (local). Padrão: variável AI_PROVIDER ou "genkit"'),
  ollamaModel: z
    .string()
    .optional()
    .describe('Modelo Ollama a utilizar (ex: llama3.2, mistral). Padrão: variável OLLAMA_MODEL ou "llama3.2"'),
});

export type GenerateReportTemplateInput = z.infer<typeof GenerateReportTemplateInputSchema>;

export const GenerateReportTemplateOutputSchema = z.object({
  html: z.string().describe('HTML do template gerado, compatível com Handlebars e GrapesJS'),
  css: z.string().describe('CSS complementar do template'),
  description: z.string().describe('Descrição do template gerado'),
  variables: z
    .array(
      z.object({
        path: z.string().describe('Caminho da variável Handlebars, ex: auction.title'),
        label: z.string().describe('Rótulo legível da variável'),
        type: z.string().describe('Tipo de dado: string, number, date, array'),
      })
    )
    .describe('Lista de variáveis utilizadas no template'),
  suggestedName: z.string().describe('Sugestão de nome para o template'),
});

export type GenerateReportTemplateOutput = z.infer<typeof GenerateReportTemplateOutputSchema>;

// ============================================================================
// CONTEXT VARIABLE MAP
// ============================================================================

/**
 * Mapa de variáveis Handlebars disponíveis por contexto.
 * Espelha as estruturas de fetchDataForContext em /api/reports/render.
 */
const CONTEXT_VARIABLES: Record<string, string> = {
  AUCTION: `
## Variáveis disponíveis – Contexto: Leilão

### Dados do Leilão
- {{auction.title}} — Título do leilão
- {{auction.publicId}} — ID público do leilão
- {{auction.status}} — Status (RASCUNHO, PUBLICADO, EM_ANDAMENTO, ENCERRADO, CANCELADO, SUSPENSO)
- {{auction.auctionType}} — Tipo (JUDICIAL, EXTRAJUDICIAL, PARTICULAR, PUBLICO, INTERNO)
- {{auction.participation}} — Modalidade (ONLINE, PRESENCIAL, HIBRIDO)
- {{auction.address}} — Endereço do leilão
- {{auction.description}} — Descrição

### Datas (usar helper {{formatDate date "DD/MM/YYYY"}})
- {{auction.auctionDate}} — Data do leilão
- {{auction.endDate}} — Data de encerramento
- {{auction.createdAt}} — Data de criação

### Estatísticas
- {{auction.totalLots}} — Total de lotes
- {{auction.visits}} — Total de visitas
- {{auction.totalHabilitatedUsers}} — Usuários habilitados

### Leiloeiro (auction.auctioneer)
- {{auction.auctioneer.name}} — Nome do leiloeiro
- {{auction.auctioneer.registrationNumber}} — Matrícula JUCESP
- {{auction.auctioneer.email}} — E-mail
- {{auction.auctioneer.phone}} — Telefone

### Comitente/Vendedor (auction.seller)
- {{auction.seller.name}} — Nome do comitente
- {{auction.seller.email}} — E-mail
- {{auction.seller.phone}} — Telefone
- {{auction.seller.isJudicial}} — É judicial (boolean)

### Lotes (array – use {{#each auction.lots}})
- {{this.number}} — Número do lote
- {{this.title}} — Título
- {{this.description}} — Descrição
- {{this.price}} — Preço atual (usar {{formatCurrency this.price}})
- {{this.status}} — Status
- {{this.category.name}} — Categoria
- {{this.winner.name}} — Arrematante vencedor

### Localização
- {{auction.city.name}} — Cidade
- {{auction.state.name}} — Estado
`,

  LOT: `
## Variáveis disponíveis – Contexto: Lote

### Dados do Lote
- {{lot.number}} — Número do lote
- {{lot.title}} — Título
- {{lot.description}} — Descrição
- {{lot.type}} — Tipo do bem
- {{lot.condition}} — Condição
- {{lot.status}} — Status
- {{lot.price}} — Preço atual (usar {{formatCurrency lot.price}})
- {{lot.initialPrice}} — Lance inicial (usar {{formatCurrency lot.initialPrice}})
- {{lot.secondInitialPrice}} — Lance inicial 2ª praça
- {{lot.bidIncrementStep}} — Incremento mínimo
- {{lot.bidsCount}} — Total de lances
- {{lot.views}} — Visualizações

### Localização
- {{lot.cityName}} — Cidade
- {{lot.stateUf}} — UF
- {{lot.mapAddress}} — Endereço completo

### Garantia
- {{lot.requiresDepositGuarantee}} — Exige caução
- {{lot.depositGuaranteeAmount}} — Valor da caução

### Datas (usar helper {{formatDate date "DD/MM/YYYY"}})
- {{lot.endDate}} — Data de encerramento
- {{lot.createdAt}} — Data de criação

### Arrematante Vencedor (lot.winner)
- {{lot.winner.name}} — Nome
- {{lot.winner.email}} — E-mail
- {{lot.winner.document}} — CPF/CNPJ

### Leilão Relacionado (lot.auction)
- {{lot.auction.title}} — Título do leilão
- {{lot.auction.auctioneer.name}} — Leiloeiro
- {{lot.auction.seller.name}} — Comitente

### Lances Recentes (array – use {{#each lot.recentBids}})
- {{this.amount}} — Valor do lance (usar {{formatCurrency this.amount}})
- {{this.bidder.name}} — Licitante
`,

  BIDDER: `
## Variáveis disponíveis – Contexto: Arrematante

### Dados Pessoais
- {{bidder.fullName}} — Nome completo
- {{bidder.email}} — E-mail
- {{bidder.document}} — CPF/CNPJ
- {{bidder.personType}} — Tipo (FISICA, JURIDICA)
- {{bidder.cellPhone}} — Telefone

### Endereço
- {{bidder.address.street}} — Logradouro
- {{bidder.address.number}} — Número
- {{bidder.address.complement}} — Complemento
- {{bidder.address.neighborhood}} — Bairro
- {{bidder.address.city}} — Cidade
- {{bidder.address.state}} — Estado
- {{bidder.address.zipCode}} — CEP

### Estatísticas
- {{bidder.totalBids}} — Total de lances
- {{bidder.totalWins}} — Total de arrematações
- {{bidder.totalSpent}} — Valor total (usar {{formatCurrency bidder.totalSpent}})

### Arrematações (array – use {{#each bidder.wins}})
- {{this.lot.title}} — Lote arrematado
- {{this.lot.number}} — Número do lote
- {{this.winningBid}} — Valor arrematado
`,

  COURT_CASE: `
## Variáveis disponíveis – Contexto: Processo Judicial

### Dados do Processo
- {{courtCase.processNumber}} — Número do processo
- {{courtCase.publicId}} — ID público
- {{courtCase.actionType}} — Tipo de ação
- {{courtCase.actionDescription}} — Descrição da ação
- {{courtCase.isElectronic}} — É eletrônico

### Tribunal
- {{courtCase.court.name}} — Nome do tribunal
- {{courtCase.court.stateUf}} — Estado
- {{courtCase.court.website}} — Website

### Comarca e Vara
- {{courtCase.district.name}} — Comarca
- {{courtCase.branch.name}} — Vara
- {{courtCase.branch.email}} — E-mail da vara
- {{courtCase.branch.phone}} — Telefone da vara

### Partes (array – use {{#each courtCase.parties}})
- {{this.name}} — Nome da parte
- {{this.documentNumber}} — CPF/CNPJ
- {{this.partyType}} — Tipo (EXEQUENTE, EXECUTADO, CREDOR, DEVEDOR, TERCEIRO_INTERESSADO)
`,

  AUCTION_RESULT: `
## Variáveis disponíveis – Contexto: Resultado de Leilão

### Resumo
- {{summary.totalLots}} — Total de lotes
- {{summary.soldLots}} — Lotes vendidos
- {{summary.unsoldLots}} — Lotes não vendidos
- {{summary.totalValue}} — Valor total avaliado (usar {{formatCurrency summary.totalValue}})
- {{summary.achievedValue}} — Valor arrecadado (usar {{formatCurrency summary.achievedValue}})
- {{summary.conversionRate}} — Taxa de conversão (%)

### Leilão (auction.*)
Mesmas variáveis do contexto AUCTION

### Lotes com Resultado (array – use {{#each lots}})
- {{this.lot.title}} — Título
- {{this.lot.number}} — Número
- {{this.winner.fullName}} — Arrematante
- {{this.winningBid}} — Lance vencedor (usar {{formatCurrency this.winningBid}})
- {{this.bidsCount}} — Total de lances
- {{this.status}} — Status

### Datas
- {{generatedAt}} — Data de geração
`,

  APPRAISAL_REPORT: `
## Variáveis disponíveis – Contexto: Laudo de Avaliação

### Avaliador
- {{appraisal.appraiser.name}} — Nome do avaliador
- {{appraisal.appraiser.registration}} — Registro profissional
- {{appraisal.appraiser.specialty}} — Especialidade
- {{appraisal.appraisalDate}} — Data da avaliação
- {{appraisal.appraisalValue}} — Valor avaliado (usar {{formatCurrency appraisal.appraisalValue}})
- {{appraisal.marketValue}} — Valor de mercado
- {{appraisal.methodology}} — Metodologia
- {{appraisal.observations}} — Observações

### Lote Avaliado (lot.*)
Mesmas variáveis do contexto LOT

### Bens Avaliados (array – use {{#each assets}})
- {{this.description}} — Descrição do bem
- {{this.condition}} — Condição
- {{this.estimatedValue}} — Valor estimado

### Processo Judicial (courtCase.* — opcional)
Mesmas variáveis do contexto COURT_CASE
`,

  INVOICE: `
## Variáveis disponíveis – Contexto: Nota de Arrematação

### Nota
- {{invoiceNumber}} — Número da nota
- {{invoiceDate}} — Data de emissão (usar {{formatDate invoiceDate "DD/MM/YYYY"}})
- {{observations}} — Observações

### Leilão
- {{auction.title}} — Título do leilão
- {{auction.auctionDate}} — Data do leilão

### Lote (lot.*)
Mesmas variáveis do contexto LOT

### Comprador (buyer.* — arrematante)
Mesmas variáveis do contexto BIDDER

### Vendedor (seller)
- {{seller.name}} — Nome
- {{seller.document}} — CNPJ/CPF
- {{seller.address}} — Endereço

### Pagamento
- {{payment.winningBid}} — Valor de arrematação (usar {{formatCurrency payment.winningBid}})
- {{payment.commission}} — Comissão (usar {{formatCurrency payment.commission}})
- {{payment.taxes}} — Impostos
- {{payment.totalAmount}} — Valor total (usar {{formatCurrency payment.totalAmount}})
- {{payment.paymentMethod}} — Forma de pagamento
- {{payment.paymentStatus}} — Status do pagamento
- {{payment.dueDate}} — Data de vencimento
`,
};

/** Helpers Handlebars disponíveis no sistema */
const HANDLEBARS_HELPERS = `
## Helpers Handlebars disponíveis

- {{formatDate date "DD/MM/YYYY"}} — Formata uma data
- {{formatDate date "DD/MM/YYYY HH:mm"}} — Data e hora
- {{formatCurrency value}} — Formata valor monetário (ex: R$ 1.234,56)
- {{formatNumber value 2}} — Formata número com casas decimais
- {{uppercase str}} — Converte para maiúsculas
- {{lowercase str}} — Converte para minúsculas
- {{default value "N/A"}} — Valor padrão se nulo
- {{math a "+" b}} — Operações matemáticas (+, -, *, /)
- {{#if value}} ... {{else}} ... {{/if}} — Condicional
- {{#each array}} ... {{/each}} — Iteração
- {{#ifEquals a b}} ... {{/ifEquals}} — Comparação de igualdade
`;

// ============================================================================
// SYSTEM PROMPT BUILDER
// ============================================================================

function buildSystemPrompt(input: GenerateReportTemplateInput): string {
  const contextVariables = CONTEXT_VARIABLES[input.contextType] || '';
  const toneInstructions =
    input.tone === 'FORMAL_JURIDICO'
      ? `Utilize tom formal jurídico, próprio de documentos legais brasileiros. 
         Use vocabulário técnico-jurídico adequado. 
         Siga as convenções de formatação de documentos oficiais brasileiros.
         Inclua espaço para assinaturas quando pertinente.`
      : input.tone === 'TECNICO'
      ? `Utilize tom técnico e objetivo, adequado para relatórios operacionais.`
      : `Utilize tom comercial e profissional.`;

  return `Você é um especialista em geração de templates HTML para relatórios jurídicos de leilão no Brasil.
Sua tarefa é gerar um template HTML completo e profissional usando Handlebars para variáveis dinâmicas.

## Regras obrigatórias:
1. O HTML deve ser válido e bem estruturado, pronto para renderização em PDF via Puppeteer
2. Use as variáveis Handlebars listadas abaixo — SOMENTE variáveis disponíveis no contexto
3. O HTML deve ser auto-contido (CSS inline ou em bloco <style>)
4. Inclua cabeçalho, corpo e rodapé adequados ao tipo de documento
5. Use formatação profissional com fontes, bordas e espaçamentos adequados
6. Respeite o tamanho de página ${input.pageSize} em orientação ${input.orientation}
7. ${toneInstructions}
8. NÃO use JavaScript no template (apenas HTML/CSS/Handlebars)
9. Use classes Tailwind CSS quando necessário (disponível via CDN)
10. Inclua números de página no rodapé quando pertinente

${HANDLEBARS_HELPERS}

${contextVariables}`;
}

// ============================================================================
// PROMPT BUILDERS (shared between providers)
// ============================================================================

function buildUserPrompt(input: GenerateReportTemplateInput): string {
  let userPrompt = `Gere um template HTML profissional para: ${input.prompt}`;

  if (input.documentText) {
    userPrompt += `\n\n## Documento de referência para análise:\n${input.documentText.substring(0, MAX_DOCUMENT_CONTEXT_CHARS)}`;
    userPrompt += `\n\nAnalise o documento acima e gere um template HTML que reproduza sua estrutura com variáveis Handlebars dinâmicas no lugar dos dados específicos.`;
  }

  userPrompt += `\n\nResponda com um JSON válido contendo:
{
  "html": "<string com o HTML completo do template>",
  "css": "<string com CSS adicional ou vazia>",
  "description": "<descrição do template gerado>",
  "variables": [{"path": "caminho.variavel", "label": "Rótulo legível", "type": "string|number|date|array"}],
  "suggestedName": "<nome sugerido para o template>"
}`;

  return userPrompt;
}

// ============================================================================
// OUTPUT PARSER (shared — handles both Genkit and Ollama raw JSON)
// ============================================================================

function parseTemplateOutput(raw: string): GenerateReportTemplateOutput {
  // Strip optional markdown code fence (```json ... ``` or ``` ... ```)
  const CODE_FENCE_RE = /^```(?:json)?\s*/i;
  const cleaned = raw.replace(CODE_FENCE_RE, '').replace(/\s*```\s*$/, '').trim();
  
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to find JSON object in the text (some models prepend text)
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('O modelo não retornou JSON válido. Tente um modelo com maior capacidade de contexto.');
    }
    parsed = JSON.parse(match[0]);
  }

  const result = GenerateReportTemplateOutputSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Resposta da IA com estrutura inválida: ${result.error.message}`);
  }
  return result.data;
}

// ============================================================================
// PROVIDER SELECTION
// ============================================================================

/**
 * Resolves which AI provider to use.
 * Priority: input.aiProvider > AI_PROVIDER env var > 'genkit'
 */
function resolveProvider(input: GenerateReportTemplateInput): AIProvider {
  const fromInput = input.aiProvider;
  const fromEnv = process.env.AI_PROVIDER as AIProvider | undefined;
  const resolved = fromInput ?? fromEnv ?? 'genkit';
  if (resolved !== 'genkit' && resolved !== 'ollama') {
    console.warn(`[AI Provider] Valor inválido "${resolved}" — usando "genkit".`);
    return 'genkit';
  }
  return resolved;
}

// ============================================================================
// GENKIT FLOW (Google AI)
// ============================================================================

const generateReportTemplateGenkitFlow = ai.defineFlow(
  {
    name: 'generateReportTemplateFlow',
    inputSchema: GenerateReportTemplateInputSchema,
    outputSchema: GenerateReportTemplateOutputSchema,
  },
  async (input) => {
    const systemPrompt = buildSystemPrompt(input);
    const userPrompt = buildUserPrompt(input);

    const response = await ai.generate({
      system: systemPrompt,
      prompt: userPrompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
      output: {
        format: 'json',
        schema: GenerateReportTemplateOutputSchema,
      },
    });

    const result = response.output;
    if (!result) {
      throw new Error('A IA não retornou um resultado válido. Tente reformular a descrição do template.');
    }

    return result;
  }
);

// ============================================================================
// OLLAMA HANDLER
// ============================================================================

async function generateWithOllamaProvider(
  input: GenerateReportTemplateInput
): Promise<GenerateReportTemplateOutput> {
  const systemPrompt = buildSystemPrompt(input);
  const userPrompt = buildUserPrompt(input);

  const raw = await generateWithOllama(
    { systemPrompt, userPrompt, temperature: 0.3, maxTokens: 8192 },
    { model: input.ollamaModel }
  );

  return parseTemplateOutput(raw.text);
}

// ============================================================================
// EXPORTED WRAPPER
// ============================================================================

/**
 * Gera um template HTML/CSS para relatórios usando IA.
 * Seleciona automaticamente o provider com base em `input.aiProvider`,
 * na variável de ambiente `AI_PROVIDER`, ou usa Genkit (Google AI) por padrão.
 *
 * @param input - Parâmetros de geração: contexto, prompt, documento, tom, provider, etc.
 * @returns Template gerado com HTML, CSS, descrição e lista de variáveis.
 */
export async function generateReportTemplate(
  input: GenerateReportTemplateInput
): Promise<GenerateReportTemplateOutput> {
  const provider = resolveProvider(input);

  if (provider === 'ollama') {
    return generateWithOllamaProvider(input);
  }

  return generateReportTemplateGenkitFlow(input);
}
