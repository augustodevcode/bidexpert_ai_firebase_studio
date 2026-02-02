// src/lib/report-builder/schemas/auction-context.schema.ts
/**
 * @fileoverview Zod Schemas para contextos de relatórios de leilões.
 * Define estruturas de dados validadas para variáveis de relatório.
 * 
 * Arquitetura: Composite (GrapesJS + Puppeteer + Handlebars)
 * @see REPORT_BUILDER_ARCHITECTURE.md
 */

import { z } from 'zod';

// ============================================================================
// AUCTION CONTEXT - Contexto para Editais e Relatórios de Leilão
// ============================================================================

export const AuctionContextSchema = z.object({
  id: z.string().describe('ID único do leilão'),
  publicId: z.string().nullable().describe('ID público do leilão'),
  title: z.string().describe('Título do leilão'),
  description: z.string().nullable().describe('Descrição detalhada'),
  status: z.enum(['RASCUNHO', 'PUBLICADO', 'EM_ANDAMENTO', 'ENCERRADO', 'CANCELADO', 'SUSPENSO']).describe('Status do leilão'),
  auctionDate: z.date().nullable().describe('Data do leilão'),
  endDate: z.date().nullable().describe('Data de encerramento'),
  totalLots: z.number().describe('Total de lotes'),
  visits: z.number().describe('Total de visitas'),
  totalHabilitatedUsers: z.number().describe('Usuários habilitados'),
  auctionType: z.enum(['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'PUBLICO', 'INTERNO']).nullable().describe('Tipo do leilão'),
  participation: z.enum(['ONLINE', 'PRESENCIAL', 'HIBRIDO']).nullable().describe('Modalidade'),
  address: z.string().nullable().describe('Endereço do leilão'),
  createdAt: z.date().describe('Data de criação'),
  
  // Relacionamentos
  auctioneer: z.object({
    id: z.string(),
    name: z.string(),
    registrationNumber: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }).nullable().describe('Leiloeiro responsável'),
  
  seller: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    isJudicial: z.boolean(),
  }).nullable().describe('Comitente/Vendedor'),
});

export type AuctionContext = z.infer<typeof AuctionContextSchema>;

// ============================================================================
// LOT CONTEXT - Contexto para Laudos e Relatórios de Lotes
// ============================================================================

export const LotContextSchema = z.object({
  id: z.string().describe('ID único do lote'),
  publicId: z.string().nullable().describe('ID público do lote'),
  number: z.string().nullable().describe('Número do lote'),
  title: z.string().describe('Título do lote'),
  description: z.string().nullable().describe('Descrição detalhada'),
  price: z.number().describe('Preço atual'),
  initialPrice: z.number().nullable().describe('Lance inicial'),
  secondInitialPrice: z.number().nullable().describe('Lance inicial 2ª praça'),
  bidIncrementStep: z.number().nullable().describe('Incremento mínimo'),
  status: z.enum([
    'EM_BREVE', 'ABERTO', 'ENCERRADO', 'ARREMATADO', 
    'NAO_ARREMATADO', 'CANCELADO', 'SUSPENSO', 'RETIRADO'
  ]).describe('Status do lote'),
  bidsCount: z.number().nullable().describe('Total de lances'),
  views: z.number().nullable().describe('Visualizações'),
  type: z.string().describe('Tipo do lote'),
  condition: z.string().nullable().describe('Condição do bem'),
  
  // Localização
  cityName: z.string().nullable().describe('Cidade'),
  stateUf: z.string().nullable().describe('Estado'),
  mapAddress: z.string().nullable().describe('Endereço completo'),
  
  // Garantia
  requiresDepositGuarantee: z.boolean().nullable().describe('Exige caução'),
  depositGuaranteeAmount: z.number().nullable().describe('Valor da caução'),
  
  // Mídia
  imageUrl: z.string().nullable().describe('URL da imagem principal'),
  galleryImageUrls: z.array(z.string()).nullable().describe('URLs das imagens da galeria'),
  
  // Datas
  endDate: z.date().nullable().describe('Data de encerramento'),
  lotSpecificAuctionDate: z.date().nullable().describe('Data específica do lote'),
  createdAt: z.date().describe('Data de criação'),
  
  // Relacionamentos
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }).nullable().describe('Categoria'),
  
  subcategory: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable().describe('Subcategoria'),
  
  winner: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    document: z.string().nullable(),
  }).nullable().describe('Arrematante vencedor'),
});

export type LotContext = z.infer<typeof LotContextSchema>;

// ============================================================================
// BIDDER CONTEXT - Contexto para Cartas de Arrematação
// ============================================================================

export const BidderContextSchema = z.object({
  id: z.string().describe('ID único do arrematante'),
  fullName: z.string().describe('Nome completo'),
  email: z.string().describe('E-mail'),
  document: z.string().nullable().describe('CPF/CNPJ'),
  personType: z.enum(['FISICA', 'JURIDICA']).nullable().describe('Tipo de pessoa'),
  cellPhone: z.string().nullable().describe('Telefone celular'),
  
  // Endereço
  address: z.object({
    street: z.string().nullable(),
    number: z.string().nullable(),
    complement: z.string().nullable(),
    neighborhood: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    zipCode: z.string().nullable(),
  }).nullable().describe('Endereço completo'),
  
  // Estatísticas
  totalBids: z.number().describe('Total de lances dados'),
  totalWins: z.number().describe('Total de arrematações'),
  totalSpent: z.number().describe('Valor total arrematado'),
  
  createdAt: z.date().describe('Data de cadastro'),
});

export type BidderContext = z.infer<typeof BidderContextSchema>;

// ============================================================================
// COURT CASE CONTEXT - Contexto para Processos Judiciais
// ============================================================================

export const CourtCaseContextSchema = z.object({
  id: z.string().describe('ID único do processo'),
  publicId: z.string().describe('ID público'),
  processNumber: z.string().describe('Número do processo'),
  isElectronic: z.boolean().describe('Processo eletrônico'),
  
  actionType: z.enum([
    'EXECUCAO_FISCAL', 'EXECUCAO_TRABALHISTA', 'EXECUCAO_CIVIL',
    'RECUPERACAO_JUDICIAL', 'FALENCIA', 'INVENTARIO', 'OUTROS'
  ]).nullable().describe('Tipo de ação'),
  actionDescription: z.string().nullable().describe('Descrição da ação'),
  
  // Relacionamentos
  court: z.object({
    id: z.string(),
    name: z.string(),
    stateUf: z.string(),
    website: z.string().nullable(),
  }).nullable().describe('Tribunal'),
  
  district: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable().describe('Comarca'),
  
  branch: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }).nullable().describe('Vara'),
  
  // Partes
  parties: z.array(z.object({
    name: z.string(),
    documentNumber: z.string().nullable(),
    partyType: z.enum(['EXEQUENTE', 'EXECUTADO', 'CREDOR', 'DEVEDOR', 'TERCEIRO_INTERESSADO']),
  })).describe('Partes do processo'),
  
  createdAt: z.date().describe('Data de criação'),
});

export type CourtCaseContext = z.infer<typeof CourtCaseContextSchema>;

// ============================================================================
// BID CONTEXT - Contexto para Relatório de Lances
// ============================================================================

export const BidContextSchema = z.object({
  id: z.string().describe('ID único do lance'),
  amount: z.number().describe('Valor do lance'),
  timestamp: z.date().describe('Data/hora do lance'),
  bidderDisplay: z.string().nullable().describe('Identificação do licitante'),
  
  bidder: z.object({
    id: z.string(),
    name: z.string(),
    document: z.string().nullable(),
  }).describe('Licitante'),
  
  lot: z.object({
    id: z.string(),
    number: z.string().nullable(),
    title: z.string(),
  }).describe('Lote'),
});

export type BidContext = z.infer<typeof BidContextSchema>;

// ============================================================================
// AUCTION RESULT CONTEXT - Contexto para Ata/Resultado de Leilão
// ============================================================================

export const AuctionResultContextSchema = z.object({
  auction: AuctionContextSchema,
  lots: z.array(z.object({
    lot: LotContextSchema,
    winner: BidderContextSchema.nullable(),
    winningBid: z.number().nullable(),
    bidsCount: z.number(),
    status: z.string(),
  })).describe('Lotes do leilão com resultados'),
  summary: z.object({
    totalLots: z.number(),
    soldLots: z.number(),
    unsoldLots: z.number(),
    totalValue: z.number(),
    achievedValue: z.number(),
    conversionRate: z.number(),
  }).describe('Resumo estatístico'),
  generatedAt: z.date().describe('Data de geração'),
});

export type AuctionResultContext = z.infer<typeof AuctionResultContextSchema>;

// ============================================================================
// APPRAISAL REPORT CONTEXT - Contexto para Laudo de Avaliação
// ============================================================================

export const AppraisalReportContextSchema = z.object({
  lot: LotContextSchema,
  courtCase: CourtCaseContextSchema.nullable(),
  
  appraisal: z.object({
    appraiser: z.object({
      name: z.string(),
      registration: z.string().nullable(),
      specialty: z.string().nullable(),
    }).describe('Avaliador'),
    appraisalDate: z.date().describe('Data da avaliação'),
    appraisalValue: z.number().describe('Valor avaliado'),
    marketValue: z.number().nullable().describe('Valor de mercado'),
    methodology: z.string().nullable().describe('Metodologia utilizada'),
    observations: z.string().nullable().describe('Observações'),
  }).describe('Dados da avaliação'),
  
  assets: z.array(z.object({
    id: z.string(),
    description: z.string(),
    condition: z.string().nullable(),
    estimatedValue: z.number().nullable(),
  })).describe('Bens avaliados'),
  
  documents: z.array(z.object({
    title: z.string(),
    description: z.string().nullable(),
    fileUrl: z.string(),
  })).describe('Documentos anexos'),
  
  generatedAt: z.date().describe('Data de geração'),
});

export type AppraisalReportContext = z.infer<typeof AppraisalReportContextSchema>;

// ============================================================================
// INVOICE CONTEXT - Contexto para Nota de Arrematação
// ============================================================================

export const InvoiceContextSchema = z.object({
  invoiceNumber: z.string().describe('Número da nota'),
  invoiceDate: z.date().describe('Data de emissão'),
  
  auction: z.object({
    id: z.string(),
    title: z.string(),
    auctionDate: z.date().nullable(),
  }).describe('Leilão'),
  
  lot: LotContextSchema,
  
  buyer: BidderContextSchema.describe('Comprador'),
  
  seller: z.object({
    name: z.string(),
    document: z.string().nullable(),
    address: z.string().nullable(),
  }).describe('Vendedor'),
  
  payment: z.object({
    winningBid: z.number().describe('Valor de arrematação'),
    commission: z.number().describe('Comissão'),
    taxes: z.number().nullable().describe('Impostos'),
    totalAmount: z.number().describe('Valor total'),
    paymentMethod: z.string().nullable().describe('Forma de pagamento'),
    paymentStatus: z.string().describe('Status do pagamento'),
    dueDate: z.date().nullable().describe('Data de vencimento'),
  }).describe('Dados do pagamento'),
  
  observations: z.string().nullable().describe('Observações'),
  generatedAt: z.date().describe('Data de geração'),
});

export type InvoiceContext = z.infer<typeof InvoiceContextSchema>;

// ============================================================================
// REGISTRY OF AVAILABLE CONTEXTS
// ============================================================================

export const REPORT_CONTEXTS = {
  AUCTION: {
    id: 'AUCTION',
    name: 'Leilão',
    description: 'Dados do leilão para editais e comunicados',
    schema: AuctionContextSchema,
    dataSource: 'Auction',
    icon: 'Gavel',
  },
  LOT: {
    id: 'LOT',
    name: 'Lote',
    description: 'Dados do lote para laudos e fichas',
    schema: LotContextSchema,
    dataSource: 'Lot',
    icon: 'Package',
  },
  BIDDER: {
    id: 'BIDDER',
    name: 'Arrematante',
    description: 'Dados do arrematante para cartas e notificações',
    schema: BidderContextSchema,
    dataSource: 'User',
    icon: 'User',
  },
  COURT_CASE: {
    id: 'COURT_CASE',
    name: 'Processo Judicial',
    description: 'Dados do processo para ofícios e comunicações judiciais',
    schema: CourtCaseContextSchema,
    dataSource: 'JudicialProcess',
    icon: 'Scale',
  },
  AUCTION_RESULT: {
    id: 'AUCTION_RESULT',
    name: 'Resultado de Leilão',
    description: 'Dados consolidados para ata e relatório de resultado',
    schema: AuctionResultContextSchema,
    dataSource: 'Auction',
    icon: 'FileCheck',
  },
  APPRAISAL_REPORT: {
    id: 'APPRAISAL_REPORT',
    name: 'Laudo de Avaliação',
    description: 'Dados para laudo técnico de avaliação',
    schema: AppraisalReportContextSchema,
    dataSource: 'Lot',
    icon: 'ClipboardList',
  },
  INVOICE: {
    id: 'INVOICE',
    name: 'Nota de Arrematação',
    description: 'Dados para emissão de nota/fatura de arrematação',
    schema: InvoiceContextSchema,
    dataSource: 'UserWin',
    icon: 'Receipt',
  },
} as const;

export type ReportContextType = keyof typeof REPORT_CONTEXTS;
