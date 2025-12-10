// src/app/admin/auctions-v2/auction-form-schema-v2.ts
/**
 * @fileoverview Schema de validação Zod para o formulário de Leilão V2.
 * Este schema é usado pelo react-hook-form para garantir que os dados
 * do formulário sejam consistentes e válidos antes de serem enviados.
 * 
 * Inclui validações:
 * - Campos obrigatórios
 * - Validação de URLs
 * - Validação de datas das praças (ordem cronológica)
 * - Validação condicional para leilão holandês
 */
import * as z from 'zod';
import { 
  auctionStatusValues, 
  auctionTypeValues, 
  auctionParticipationValues, 
  auctionMethodValues 
} from '@/lib/zod-enums';

// Helper para validar URLs opcionais (aceita string vazia)
const optionalUrlSchema = z
  .string()
  .url({ message: 'URL inválida.' })
  .or(z.literal(''))
  .optional()
  .nullable();

// Schema para etapas/praças do leilão
const auctionStageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome da praça é obrigatório'),
  startDate: z.date({ required_error: 'Data de início da praça é obrigatória' }),
  endDate: z.date({ required_error: 'Data de encerramento da praça é obrigatória' }),
  initialPrice: z.coerce.number().positive('O valor deve ser positivo.').optional().nullable(),
});

// Schema principal do formulário
export const auctionFormSchema = z.object({
  // Informações Gerais
  title: z
    .string()
    .min(5, { message: 'O título do leilão deve ter pelo menos 5 caracteres.' })
    .max(200, { message: 'O título do leilão não pode exceder 200 caracteres.' }),
  
  description: z
    .string()
    .max(5000, { message: 'A descrição não pode exceder 5000 caracteres.' })
    .optional()
    .nullable(),
  
  status: z.enum(auctionStatusValues as [string, ...string[]]).optional(),
  
  categoryId: z.string().min(1, { message: 'A categoria é obrigatória.' }),

  // Participantes
  auctioneerId: z.string().min(1, { message: 'O leiloeiro é obrigatório.' }),
  sellerId: z.string().min(1, { message: 'O comitente é obrigatório.' }),
  judicialProcessId: z.string().optional().nullable(),

  // Modalidade e Método
  auctionType: z.enum(auctionTypeValues as [string, ...string[]], {
    errorMap: () => ({ message: 'Por favor, selecione uma modalidade válida.' }),
  }),
  
  auctionMethod: z
    .enum(auctionMethodValues as [string, ...string[]])
    .default('STANDARD'),
  
  participation: z
    .enum(auctionParticipationValues as [string, ...string[]])
    .default('ONLINE'),

  // URL Online
  onlineUrl: optionalUrlSchema,

  // Endereço
  street: z.string().max(255).optional().nullable(),
  number: z.string().max(20).optional().nullable(),
  complement: z.string().max(100).optional().nullable(),
  neighborhood: z.string().max(100).optional().nullable(),
  cityId: z.string().optional().nullable(),
  stateId: z.string().optional().nullable(),
  zipCode: z.string().max(10).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),

  // Mídia
  imageUrl: optionalUrlSchema,
  imageMediaId: z.string().optional().nullable(),
  documentsUrl: optionalUrlSchema,
  evaluationReportUrl: optionalUrlSchema,
  auctionCertificateUrl: optionalUrlSchema,

  // Opções de Lance
  automaticBiddingEnabled: z.boolean().optional().default(false),
  allowInstallmentBids: z.boolean().optional().default(true),
  silentBiddingEnabled: z.boolean().optional().default(false),
  allowMultipleBidsPerUser: z.boolean().optional().default(true),
  
  // Soft Close
  softCloseEnabled: z.boolean().optional().default(false),
  softCloseMinutes: z.coerce
    .number()
    .int()
    .min(1, 'Mínimo de 1 minuto')
    .max(30, 'Máximo de 30 minutos')
    .optional()
    .default(2),

  // Marketplace
  isFeaturedOnMarketplace: z.boolean().optional().default(false),
  marketplaceAnnouncementTitle: z
    .string()
    .max(150, { message: 'Título do anúncio muito longo.' })
    .optional()
    .nullable(),

  // Leilão Holandês
  decrementAmount: z.coerce
    .number()
    .positive('O valor do decremento deve ser positivo.')
    .optional()
    .nullable(),
  
  decrementIntervalSeconds: z.coerce
    .number()
    .int()
    .min(1, 'O intervalo deve ser de no mínimo 1 segundo.')
    .optional()
    .nullable(),
  
  floorPrice: z.coerce
    .number()
    .positive('O preço mínimo deve ser positivo.')
    .optional()
    .nullable(),

  // Etapas/Praças
  auctionStages: z
    .array(auctionStageSchema)
    .min(1, 'O leilão deve ter pelo menos uma praça/etapa.')
    .optional()
    .default([
      {
        name: '1ª Praça',
        startDate: new Date(),
        endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        initialPrice: null,
      },
    ])
    .refine(
      (stages) => {
        if (!stages || stages.length <= 1) return true;
        for (let i = 1; i < stages.length; i++) {
          if (
            stages[i]?.startDate &&
            stages[i - 1]?.endDate &&
            stages[i].startDate! < stages[i - 1].endDate!
          ) {
            return false;
          }
        }
        return true;
      },
      {
        message:
          'A data de início de uma etapa não pode ser anterior à data de término da etapa anterior.',
        path: ['auctionStages'],
      }
    ),

  // Estimativa de Receita
  estimatedRevenue: z.coerce
    .number()
    .positive({ message: 'Estimativa deve ser positiva.' })
    .optional()
    .nullable(),
})
  // Validação condicional para Leilão Holandês
  .refine(
    (data) => {
      if (data.auctionMethod === 'DUTCH') {
        return (
          !!data.decrementAmount &&
          !!data.decrementIntervalSeconds &&
          !!data.floorPrice
        );
      }
      return true;
    },
    {
      message:
        'Para Leilões Holandeses, o Valor do Decremento, Intervalo e Preço Mínimo são obrigatórios.',
      path: ['decrementAmount'],
    }
  );

// Tipo inferido do schema
export type AuctionFormValues = z.infer<typeof auctionFormSchema>;
