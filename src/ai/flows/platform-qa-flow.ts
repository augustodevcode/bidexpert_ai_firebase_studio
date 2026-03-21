/**
 * src/ai/flows/platform-qa-flow.ts
 * Flow de Q&A inteligente sobre a plataforma BidExpert.
 *
 * Permite que usuários façam perguntas sobre como usar a plataforma,
 * regras de leilão, fluxos de cadastro, habilitação, etc.
 *
 * Suporta dois providers:
 * - googleai: Google Gemini via Genkit (ai.generate com streaming nativo)
 * - ollama: Modelos locais via REST API com streaming SSE
 */

import { ai, AI_CONFIG } from '@/ai/genkit';
import { callOllama, callOllamaStream } from '@/lib/ai/provider';
import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const PlatformQAInputSchema = z.object({
  message: z
    .string()
    .min(1, 'Mensagem não pode ser vazia')
    .max(2000, 'Mensagem muito longa (máximo 2000 caracteres)'),
  history: z
    .array(ChatMessageSchema)
    .max(20, 'Histórico muito longo')
    .default([]),
  tenantName: z.string().optional(),
});

export const PlatformQAOutputSchema = z.object({
  response: z.string(),
  provider: z.enum(['googleai', 'ollama']),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type PlatformQAInput = z.infer<typeof PlatformQAInputSchema>;
export type PlatformQAOutput = z.infer<typeof PlatformQAOutputSchema>;

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

function buildQASystemPrompt(tenantName?: string): string {
  const platform = tenantName ? `a plataforma ${tenantName} (BidExpert)` : 'a plataforma BidExpert';

  return `Você é um assistente especializado de ${platform}, uma plataforma brasileira de leilões eletrônicos.

## Sua função
Responda dúvidas dos usuários sobre como usar a plataforma, processos de leilão, cadastros, habilitações, lances, documentação e regras gerais.

## Conhecimento da plataforma BidExpert

### Leilões
- Tipos: Judicial, Extrajudicial, Particular, Público, Interno
- Modalidades de participação: Online, Presencial, Híbrido
- Status do leilão: Rascunho → Publicado → Em Andamento → Encerrado
- Praças: Um leilão pode ter múltiplas praças (1ª, 2ª praça) com datas e preços diferentes

### Lotes
- Cada leilão possui lotes com bem descrito, categoria, lance inicial e incremento mínimo
- Status do lote: Aguardando, Aberto para Lances, Encerrado, Cancelado, Suspenso
- Podem exigir caução (depósito de garantia) para habilitação
- Tipos de bem: Imóvel, Veículo, Equipamento, Direitos, Estoque, etc.

### Habilitação e Lances
- Usuários precisam se habilitar em cada leilão para poder dar lances
- Habilitação requer envio de documentos (CPF/CNPJ, comprovante de residência, etc.)
- Caução: percentual do valor do lote a ser depositado antes de licitar
- Lance mínimo = lance inicial + incremento mínimo
- Arremate: quem deu o maior lance ao encerrar o lote

### Perfis de usuário
- Comprador (Arrematante): participa de leilões, dá lances, arremata lotes
- Leiloeiro: realiza leilões, define lotes e condições
- Vendedor (Comitente): dono do bem sendo leiloado
- Advogado: representa partes em leilões judiciais
- Analista: equipe interna da leiloeira
- Admin: administração da plataforma

### Documentos e Relatórios
- A plataforma gera automaticamente: Nota de Arrematação, Carta de Arremate, Auto de Arrematação
- Templates de relatório personalizáveis via Report Builder (arrastar e soltar)
- Integração com processos judiciais (número, vara, comarca, partes)

### Pagamentos e Comissões
- Comissão do leiloeiro: percentual sobre o valor do arremate
- Formas de pagamento: PIX, boleto, transferência
- Prazo para pagamento definido em edital

### Acesso e Segurança
- Perfis multi-tenant: cada leiloeira tem seu ambiente isolado
- Autenticação segura, histórico de ações auditado
- LGPD: dados pessoais tratados com privacidade

## Regras de comportamento
1. Responda SEMPRE em português brasileiro
2. Seja objetivo e claro, use listas quando conveniente
3. Se não souber a resposta exata, oriente o usuário a contatar o suporte
4. Não invente URLs, preços ou dados concretos que não foram fornecidos
5. Para questões jurídicas específicas, recomende consultar um advogado
6. Mantenha tom profissional mas acessível
7. Respostas curtas para perguntas simples, detalhadas para processos complexos
`;
}

// ============================================================================
// GENKIT FLOW (Google AI path)
// ============================================================================

const platformQAFlow = ai.defineFlow(
  {
    name: 'platformQAFlow',
    inputSchema: PlatformQAInputSchema,
    outputSchema: PlatformQAOutputSchema,
  },
  async (input) => {
    const systemPrompt = buildQASystemPrompt(input.tenantName);

    // Build the conversation prompt including history
    const historyText = input.history
      .map((m) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
      .join('\n\n');

    const fullPrompt = historyText
      ? `${historyText}\n\nUsuário: ${input.message}`
      : `Usuário: ${input.message}`;

    const response = await ai.generate({
      system: systemPrompt,
      prompt: fullPrompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    return {
      response: response.text,
      provider: 'googleai' as const,
    };
  }
);

// ============================================================================
// EXPORTED WRAPPERS
// ============================================================================

/**
 * Responde uma pergunta sobre a plataforma BidExpert.
 * Usa Google AI (Genkit) ou Ollama dependendo de AI_PROVIDER.
 */
export async function askPlatformQuestion(
  input: PlatformQAInput
): Promise<PlatformQAOutput> {
  if (AI_CONFIG.provider === 'ollama') {
    const systemPrompt = buildQASystemPrompt(input.tenantName);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...input.history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: input.message },
    ];

    const result = await callOllama(messages, { temperature: 0.7, maxTokens: 1024 });

    return {
      response: result.text,
      provider: 'ollama',
    };
  }

  return platformQAFlow(input);
}

/**
 * Responde uma pergunta com resposta em streaming (ideal para chatbot UI).
 * Ollama: streaming via SSE; Google AI: simula com resposta completa.
 */
export async function* askPlatformQuestionStream(
  input: PlatformQAInput
): AsyncGenerator<string> {
  if (AI_CONFIG.provider === 'ollama') {
    const systemPrompt = buildQASystemPrompt(input.tenantName);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...input.history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: input.message },
    ];

    yield* callOllamaStream(messages, { temperature: 0.7, maxTokens: 1024 });
    return;
  }

  // Google AI path: return full response as single chunk
  const result = await platformQAFlow(input);
  yield result.response;
}

export { buildQASystemPrompt };
