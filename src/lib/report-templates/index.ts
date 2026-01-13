// src/lib/report-templates/index.ts
/**
 * @fileoverview Templates de relatórios predefinidos para leilões.
 * Inclui templates para todas as fases de leilões judiciais e extrajudiciais.
 */

import type { ReportDefinition, ReportType, TableConfig } from '@/types/report-builder.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'JUDICIAL' | 'EXTRAJUDICIAL' | 'ADMINISTRATIVO' | 'FINANCEIRO' | 'OPERACIONAL';
  phase?: string;
  type: ReportType;
  icon: string;
  definition: ReportDefinition;
  requiredPermissions?: string[];
  availableFor: ('ADMIN' | 'AUCTIONEER' | 'ANALYST' | 'BIDDER')[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createTableConfig(columns: Array<{ field: string; header: string; width?: number; format?: string }>): TableConfig {
  return {
    columns: columns.map((col, idx) => ({
      id: `col-${idx}`,
      fieldBinding: col.field,
      header: col.header,
      width: col.width || 150,
      visible: true,
      format: col.format,
    })),
    alternateRowColors: true,
    showGridLines: true,
    headerStyle: {
      backgroundColor: '#1e40af',
      color: '#ffffff',
      fontWeight: 'bold',
    },
  };
}

function createReportDefinition(
  id: string,
  title: string,
  dataSource: string,
  columns: Array<{ field: string; header: string; width?: number; format?: string }>,
  type: ReportType = 'TABLE'
): ReportDefinition {
  return {
    id,
    version: '1.0.0',
    reportType: type,
    dataSource,
    layout: {
      pageSize: 'A4',
      orientation: 'LANDSCAPE',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
    },
    bands: [
      { id: 'reportHeader', type: 'REPORT_HEADER', height: 80 },
      { id: 'pageHeader', type: 'PAGE_HEADER', height: 30 },
      { id: 'detail', type: 'DETAIL', height: 400 },
      { id: 'pageFooter', type: 'PAGE_FOOTER', height: 30 },
      { id: 'reportFooter', type: 'REPORT_FOOTER', height: 50 },
    ],
    elements: [
      {
        id: 'title',
        type: 'text',
        bandId: 'reportHeader',
        position: { x: 0, y: 10 },
        size: { width: 800, height: 35 },
        properties: {
          content: title,
          font: { family: 'Inter', size: 22, weight: 'bold' },
          textAlign: 'center',
          color: '#1e293b',
        },
      },
      {
        id: 'subtitle',
        type: 'text',
        bandId: 'reportHeader',
        position: { x: 0, y: 45 },
        size: { width: 800, height: 20 },
        properties: {
          content: 'Gerado em: {{currentDate}} | BidExpert',
          font: { family: 'Inter', size: 10 },
          textAlign: 'center',
          color: '#64748b',
        },
      },
      {
        id: 'mainTable',
        type: 'table',
        bandId: 'detail',
        position: { x: 0, y: 0 },
        size: { width: 800, height: 380 },
        properties: {
          tableConfig: createTableConfig(columns),
        },
      },
      {
        id: 'pageNumber',
        type: 'text',
        bandId: 'pageFooter',
        position: { x: 700, y: 5 },
        size: { width: 100, height: 20 },
        properties: {
          content: 'Página {{pageNumber}} de {{totalPages}}',
          fontSize: 9,
          textAlign: 'right',
          color: '#64748b',
        },
      },
    ],
    styles: {
      default: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
        color: '#1e293b',
      },
    },
    parameters: [],
  };
}

// ============================================================================
// TEMPLATES - LEILÕES JUDICIAIS
// ============================================================================

export const JUDICIAL_TEMPLATES: ReportTemplate[] = [
  {
    id: 'EDITAL_LEILAO_JUDICIAL',
    name: 'Edital de Leilão Judicial',
    description: 'Edital completo para publicação de leilão judicial com todos os dados do processo.',
    category: 'JUDICIAL',
    phase: 'PRE_LEILAO',
    type: 'FORM',
    icon: 'FileText',
    availableFor: ['ADMIN', 'AUCTIONEER', 'ANALYST'],
    definition: createReportDefinition(
      'EDITAL_LEILAO_JUDICIAL',
      'EDITAL DE LEILÃO JUDICIAL',
      'judicial_auction_notice',
      [
        { field: 'processNumber', header: 'Nº Processo', width: 150 },
        { field: 'court', header: 'Vara/Comarca', width: 200 },
        { field: 'plaintiff', header: 'Exequente', width: 180 },
        { field: 'defendant', header: 'Executado', width: 180 },
        { field: 'assetDescription', header: 'Descrição do Bem', width: 300 },
        { field: 'evaluationValue', header: 'Valor Avaliação', width: 120, format: 'currency' },
        { field: 'minimumBid', header: 'Lance Mínimo', width: 120, format: 'currency' },
        { field: 'auctionDate', header: 'Data Leilão', width: 100, format: 'date' },
      ]
    ),
  },
  {
    id: 'AUTO_ARREMATACAO',
    name: 'Auto de Arrematação',
    description: 'Documento oficial de arrematação para homologação judicial.',
    category: 'JUDICIAL',
    phase: 'POS_LEILAO',
    type: 'FORM',
    icon: 'Award',
    availableFor: ['ADMIN', 'AUCTIONEER'],
    definition: createReportDefinition(
      'AUTO_ARREMATACAO',
      'AUTO DE ARREMATAÇÃO',
      'auction_award_deed',
      [
        { field: 'auctionNumber', header: 'Nº Leilão', width: 100 },
        { field: 'lotNumber', header: 'Nº Lote', width: 80 },
        { field: 'processNumber', header: 'Nº Processo', width: 140 },
        { field: 'assetDescription', header: 'Bem Arrematado', width: 250 },
        { field: 'winnerName', header: 'Arrematante', width: 180 },
        { field: 'winnerCpfCnpj', header: 'CPF/CNPJ', width: 130 },
        { field: 'finalBid', header: 'Valor Arrematação', width: 130, format: 'currency' },
        { field: 'awardDate', header: 'Data', width: 100, format: 'date' },
      ]
    ),
  },
  {
    id: 'CERTIDAO_HASTA_PUBLICA',
    name: 'Certidão de Hasta Pública',
    description: 'Certidão oficial da realização da hasta pública.',
    category: 'JUDICIAL',
    phase: 'POS_LEILAO',
    type: 'FORM',
    icon: 'FileCheck',
    availableFor: ['ADMIN', 'AUCTIONEER'],
    definition: createReportDefinition(
      'CERTIDAO_HASTA_PUBLICA',
      'CERTIDÃO DE HASTA PÚBLICA',
      'public_auction_certificate',
      [
        { field: 'processNumber', header: 'Processo', width: 140 },
        { field: 'court', header: 'Juízo', width: 180 },
        { field: 'auctionDate', header: 'Data Hasta', width: 100, format: 'date' },
        { field: 'firstAuctionResult', header: '1ª Praça', width: 150 },
        { field: 'secondAuctionResult', header: '2ª Praça', width: 150 },
        { field: 'totalLots', header: 'Total Lotes', width: 80 },
        { field: 'soldLots', header: 'Vendidos', width: 80 },
        { field: 'totalValue', header: 'Valor Total', width: 130, format: 'currency' },
      ]
    ),
  },
  {
    id: 'TERMO_DEPOSITO_JUDICIAL',
    name: 'Termo de Depósito Judicial',
    description: 'Termo de depósito dos valores arrecadados em leilão judicial.',
    category: 'JUDICIAL',
    phase: 'POS_LEILAO',
    type: 'FORM',
    icon: 'Landmark',
    availableFor: ['ADMIN', 'AUCTIONEER'],
    definition: createReportDefinition(
      'TERMO_DEPOSITO_JUDICIAL',
      'TERMO DE DEPÓSITO JUDICIAL',
      'judicial_deposit_term',
      [
        { field: 'depositNumber', header: 'Nº Guia', width: 120 },
        { field: 'processNumber', header: 'Processo', width: 140 },
        { field: 'court', header: 'Vara', width: 150 },
        { field: 'depositor', header: 'Depositante', width: 180 },
        { field: 'amount', header: 'Valor', width: 130, format: 'currency' },
        { field: 'depositDate', header: 'Data Depósito', width: 100, format: 'date' },
        { field: 'bank', header: 'Banco', width: 120 },
        { field: 'account', header: 'Conta', width: 120 },
      ]
    ),
  },
  {
    id: 'RELATORIO_LANCES_JUDICIAL',
    name: 'Relatório de Lances - Judicial',
    description: 'Histórico completo de lances para processos judiciais.',
    category: 'JUDICIAL',
    phase: 'DURANTE_LEILAO',
    type: 'TABLE',
    icon: 'TrendingUp',
    availableFor: ['ADMIN', 'AUCTIONEER', 'ANALYST'],
    definition: createReportDefinition(
      'RELATORIO_LANCES_JUDICIAL',
      'RELATÓRIO DE LANCES - LEILÃO JUDICIAL',
      'judicial_bids_report',
      [
        { field: 'lotNumber', header: 'Lote', width: 70 },
        { field: 'processNumber', header: 'Processo', width: 130 },
        { field: 'bidderName', header: 'Licitante', width: 180 },
        { field: 'bidderDocument', header: 'CPF/CNPJ', width: 130 },
        { field: 'bidValue', header: 'Valor Lance', width: 120, format: 'currency' },
        { field: 'bidTime', header: 'Horário', width: 90, format: 'datetime' },
        { field: 'bidType', header: 'Tipo', width: 90 },
        { field: 'isWinning', header: 'Vencedor', width: 80 },
      ]
    ),
  },
];

// ============================================================================
// TEMPLATES - LEILÕES EXTRAJUDICIAIS
// ============================================================================

export const EXTRAJUDICIAL_TEMPLATES: ReportTemplate[] = [
  {
    id: 'CATALOGO_LEILAO',
    name: 'Catálogo de Leilão',
    description: 'Catálogo completo com todos os lotes do leilão.',
    category: 'EXTRAJUDICIAL',
    phase: 'PRE_LEILAO',
    type: 'TABLE',
    icon: 'BookOpen',
    availableFor: ['ADMIN', 'AUCTIONEER', 'ANALYST', 'BIDDER'],
    definition: createReportDefinition(
      'CATALOGO_LEILAO',
      'CATÁLOGO DE LEILÃO',
      'auction_catalog',
      [
        { field: 'lotNumber', header: 'Lote', width: 60 },
        { field: 'title', header: 'Título', width: 200 },
        { field: 'category', header: 'Categoria', width: 120 },
        { field: 'description', header: 'Descrição', width: 250 },
        { field: 'evaluationValue', header: 'Avaliação', width: 110, format: 'currency' },
        { field: 'startingBid', header: 'Lance Inicial', width: 110, format: 'currency' },
        { field: 'location', header: 'Localização', width: 150 },
      ]
    ),
  },
  {
    id: 'FICHA_CADASTRAL_ARREMATANTE',
    name: 'Ficha Cadastral do Arrematante',
    description: 'Dados cadastrais completos do arrematante.',
    category: 'EXTRAJUDICIAL',
    phase: 'POS_LEILAO',
    type: 'FORM',
    icon: 'UserCheck',
    availableFor: ['ADMIN', 'AUCTIONEER'],
    definition: createReportDefinition(
      'FICHA_CADASTRAL_ARREMATANTE',
      'FICHA CADASTRAL DO ARREMATANTE',
      'winner_registration',
      [
        { field: 'name', header: 'Nome/Razão Social', width: 250 },
        { field: 'cpfCnpj', header: 'CPF/CNPJ', width: 140 },
        { field: 'email', header: 'E-mail', width: 200 },
        { field: 'phone', header: 'Telefone', width: 130 },
        { field: 'address', header: 'Endereço', width: 300 },
        { field: 'city', header: 'Cidade', width: 150 },
        { field: 'state', header: 'UF', width: 50 },
        { field: 'registrationDate', header: 'Data Cadastro', width: 100, format: 'date' },
      ]
    ),
  },
  {
    id: 'NOTA_ARREMATACAO',
    name: 'Nota de Arrematação',
    description: 'Nota de venda/arrematação para leilões extrajudiciais.',
    category: 'EXTRAJUDICIAL',
    phase: 'POS_LEILAO',
    type: 'INVOICE',
    icon: 'Receipt',
    availableFor: ['ADMIN', 'AUCTIONEER'],
    definition: createReportDefinition(
      'NOTA_ARREMATACAO',
      'NOTA DE ARREMATAÇÃO',
      'auction_invoice',
      [
        { field: 'invoiceNumber', header: 'Nº Nota', width: 100 },
        { field: 'auctionName', header: 'Leilão', width: 200 },
        { field: 'lotNumber', header: 'Lote', width: 70 },
        { field: 'itemDescription', header: 'Descrição', width: 250 },
        { field: 'winnerName', header: 'Arrematante', width: 180 },
        { field: 'hammerPrice', header: 'Valor Martelo', width: 120, format: 'currency' },
        { field: 'buyerPremium', header: 'Comissão', width: 100, format: 'currency' },
        { field: 'totalAmount', header: 'Total', width: 120, format: 'currency' },
      ]
    ),
  },
  {
    id: 'TERMO_ENTREGA',
    name: 'Termo de Entrega',
    description: 'Termo de retirada/entrega do bem arrematado.',
    category: 'EXTRAJUDICIAL',
    phase: 'POS_LEILAO',
    type: 'FORM',
    icon: 'Package',
    availableFor: ['ADMIN', 'AUCTIONEER'],
    definition: createReportDefinition(
      'TERMO_ENTREGA',
      'TERMO DE ENTREGA',
      'delivery_term',
      [
        { field: 'termNumber', header: 'Nº Termo', width: 100 },
        { field: 'auctionName', header: 'Leilão', width: 180 },
        { field: 'lotNumber', header: 'Lote', width: 70 },
        { field: 'itemDescription', header: 'Bem', width: 220 },
        { field: 'receiverName', header: 'Recebedor', width: 180 },
        { field: 'receiverDocument', header: 'Documento', width: 130 },
        { field: 'deliveryDate', header: 'Data Entrega', width: 100, format: 'date' },
        { field: 'observations', header: 'Observações', width: 200 },
      ]
    ),
  },
];

// ============================================================================
// TEMPLATES - ADMINISTRATIVOS
// ============================================================================

export const ADMIN_TEMPLATES: ReportTemplate[] = [
  {
    id: 'RELATORIO_LEILOES_PERIODO',
    name: 'Relatório de Leilões por Período',
    description: 'Lista de leilões realizados em determinado período.',
    category: 'ADMINISTRATIVO',
    type: 'TABLE',
    icon: 'Calendar',
    availableFor: ['ADMIN', 'AUCTIONEER', 'ANALYST'],
    definition: createReportDefinition(
      'RELATORIO_LEILOES_PERIODO',
      'RELATÓRIO DE LEILÕES POR PERÍODO',
      'auctions_by_period',
      [
        { field: 'auctionNumber', header: 'Nº Leilão', width: 100 },
        { field: 'name', header: 'Nome', width: 200 },
        { field: 'type', header: 'Tipo', width: 100 },
        { field: 'startDate', header: 'Início', width: 100, format: 'date' },
        { field: 'endDate', header: 'Término', width: 100, format: 'date' },
        { field: 'totalLots', header: 'Lotes', width: 70 },
        { field: 'soldLots', header: 'Vendidos', width: 80 },
        { field: 'totalSales', header: 'Vendas', width: 120, format: 'currency' },
        { field: 'status', header: 'Status', width: 100 },
      ]
    ),
  },
  {
    id: 'RELATORIO_LOTES_STATUS',
    name: 'Relatório de Lotes por Status',
    description: 'Distribuição de lotes por status de venda.',
    category: 'ADMINISTRATIVO',
    type: 'TABLE',
    icon: 'PieChart',
    availableFor: ['ADMIN', 'AUCTIONEER', 'ANALYST'],
    definition: createReportDefinition(
      'RELATORIO_LOTES_STATUS',
      'RELATÓRIO DE LOTES POR STATUS',
      'lots_by_status',
      [
        { field: 'auctionName', header: 'Leilão', width: 180 },
        { field: 'lotNumber', header: 'Lote', width: 70 },
        { field: 'title', header: 'Título', width: 200 },
        { field: 'status', header: 'Status', width: 100 },
        { field: 'evaluationValue', header: 'Avaliação', width: 110, format: 'currency' },
        { field: 'currentBid', header: 'Lance Atual', width: 110, format: 'currency' },
        { field: 'bidCount', header: 'Lances', width: 70 },
        { field: 'viewCount', header: 'Visualizações', width: 90 },
      ]
    ),
  },
  {
    id: 'RELATORIO_USUARIOS_ATIVOS',
    name: 'Relatório de Usuários Ativos',
    description: 'Lista de usuários cadastrados e ativos na plataforma.',
    category: 'ADMINISTRATIVO',
    type: 'TABLE',
    icon: 'Users',
    availableFor: ['ADMIN'],
    definition: createReportDefinition(
      'RELATORIO_USUARIOS_ATIVOS',
      'RELATÓRIO DE USUÁRIOS ATIVOS',
      'active_users',
      [
        { field: 'name', header: 'Nome', width: 200 },
        { field: 'email', header: 'E-mail', width: 200 },
        { field: 'role', header: 'Perfil', width: 120 },
        { field: 'registrationDate', header: 'Cadastro', width: 100, format: 'date' },
        { field: 'lastAccess', header: 'Último Acesso', width: 120, format: 'datetime' },
        { field: 'totalBids', header: 'Lances', width: 80 },
        { field: 'totalWins', header: 'Vitórias', width: 80 },
        { field: 'status', header: 'Status', width: 90 },
      ]
    ),
  },
  {
    id: 'RELATORIO_COMITENTES',
    name: 'Relatório de Comitentes',
    description: 'Lista de comitentes/vendedores cadastrados.',
    category: 'ADMINISTRATIVO',
    type: 'TABLE',
    icon: 'Briefcase',
    availableFor: ['ADMIN', 'AUCTIONEER'],
    definition: createReportDefinition(
      'RELATORIO_COMITENTES',
      'RELATÓRIO DE COMITENTES',
      'sellers_report',
      [
        { field: 'name', header: 'Nome/Razão Social', width: 220 },
        { field: 'cpfCnpj', header: 'CPF/CNPJ', width: 140 },
        { field: 'email', header: 'E-mail', width: 180 },
        { field: 'phone', header: 'Telefone', width: 120 },
        { field: 'totalAssets', header: 'Bens', width: 70 },
        { field: 'soldAssets', header: 'Vendidos', width: 80 },
        { field: 'totalSales', header: 'Total Vendas', width: 120, format: 'currency' },
        { field: 'status', header: 'Status', width: 90 },
      ]
    ),
  },
];

// ============================================================================
// TEMPLATES - FINANCEIROS
// ============================================================================

export const FINANCIAL_TEMPLATES: ReportTemplate[] = [
  {
    id: 'RELATORIO_VENDAS',
    name: 'Relatório de Vendas',
    description: 'Relatório consolidado de vendas realizadas.',
    category: 'FINANCEIRO',
    type: 'TABLE',
    icon: 'DollarSign',
    availableFor: ['ADMIN', 'AUCTIONEER'],
    definition: createReportDefinition(
      'RELATORIO_VENDAS',
      'RELATÓRIO DE VENDAS',
      'sales_report',
      [
        { field: 'saleDate', header: 'Data', width: 100, format: 'date' },
        { field: 'auctionName', header: 'Leilão', width: 160 },
        { field: 'lotNumber', header: 'Lote', width: 70 },
        { field: 'itemTitle', header: 'Item', width: 200 },
        { field: 'buyerName', header: 'Comprador', width: 160 },
        { field: 'hammerPrice', header: 'Valor Martelo', width: 110, format: 'currency' },
        { field: 'buyerPremium', header: 'Comissão', width: 100, format: 'currency' },
        { field: 'netAmount', header: 'Líquido', width: 110, format: 'currency' },
      ]
    ),
  },
  {
    id: 'RELATORIO_COMISSOES',
    name: 'Relatório de Comissões',
    description: 'Detalhamento de comissões por leilão/período.',
    category: 'FINANCEIRO',
    type: 'TABLE',
    icon: 'Percent',
    availableFor: ['ADMIN', 'AUCTIONEER'],
    definition: createReportDefinition(
      'RELATORIO_COMISSOES',
      'RELATÓRIO DE COMISSÕES',
      'commissions_report',
      [
        { field: 'auctionName', header: 'Leilão', width: 180 },
        { field: 'totalSales', header: 'Total Vendas', width: 120, format: 'currency' },
        { field: 'buyerCommission', header: 'Comissão Comprador', width: 130, format: 'currency' },
        { field: 'sellerCommission', header: 'Comissão Vendedor', width: 130, format: 'currency' },
        { field: 'totalCommission', header: 'Total Comissões', width: 130, format: 'currency' },
        { field: 'commissionRate', header: 'Taxa %', width: 80, format: 'percent' },
        { field: 'paymentStatus', header: 'Status Pgto', width: 100 },
      ]
    ),
  },
  {
    id: 'RELATORIO_PAGAMENTOS',
    name: 'Relatório de Pagamentos',
    description: 'Controle de pagamentos recebidos.',
    category: 'FINANCEIRO',
    type: 'TABLE',
    icon: 'CreditCard',
    availableFor: ['ADMIN', 'AUCTIONEER'],
    definition: createReportDefinition(
      'RELATORIO_PAGAMENTOS',
      'RELATÓRIO DE PAGAMENTOS',
      'payments_report',
      [
        { field: 'paymentDate', header: 'Data', width: 100, format: 'date' },
        { field: 'paymentId', header: 'ID Pagamento', width: 120 },
        { field: 'buyerName', header: 'Pagador', width: 180 },
        { field: 'auctionName', header: 'Leilão', width: 150 },
        { field: 'lotNumber', header: 'Lote', width: 70 },
        { field: 'amount', header: 'Valor', width: 110, format: 'currency' },
        { field: 'paymentMethod', header: 'Método', width: 100 },
        { field: 'status', header: 'Status', width: 90 },
      ]
    ),
  },
  {
    id: 'RELATORIO_REPASSES',
    name: 'Relatório de Repasses',
    description: 'Controle de repasses aos comitentes.',
    category: 'FINANCEIRO',
    type: 'TABLE',
    icon: 'ArrowRightLeft',
    availableFor: ['ADMIN', 'AUCTIONEER'],
    definition: createReportDefinition(
      'RELATORIO_REPASSES',
      'RELATÓRIO DE REPASSES AOS COMITENTES',
      'transfers_report',
      [
        { field: 'transferDate', header: 'Data', width: 100, format: 'date' },
        { field: 'sellerName', header: 'Comitente', width: 200 },
        { field: 'auctionName', header: 'Leilão', width: 150 },
        { field: 'grossAmount', header: 'Valor Bruto', width: 110, format: 'currency' },
        { field: 'commissionDeducted', header: 'Comissão', width: 100, format: 'currency' },
        { field: 'netAmount', header: 'Valor Líquido', width: 110, format: 'currency' },
        { field: 'bank', header: 'Banco', width: 100 },
        { field: 'status', header: 'Status', width: 90 },
      ]
    ),
  },
];

// ============================================================================
// TEMPLATES - OPERACIONAIS
// ============================================================================

export const OPERATIONAL_TEMPLATES: ReportTemplate[] = [
  {
    id: 'RELATORIO_LANCES',
    name: 'Relatório de Lances',
    description: 'Histórico detalhado de todos os lances.',
    category: 'OPERACIONAL',
    type: 'TABLE',
    icon: 'Activity',
    availableFor: ['ADMIN', 'AUCTIONEER', 'ANALYST'],
    definition: createReportDefinition(
      'RELATORIO_LANCES',
      'RELATÓRIO DE LANCES',
      'bids_report',
      [
        { field: 'bidTime', header: 'Data/Hora', width: 130, format: 'datetime' },
        { field: 'auctionName', header: 'Leilão', width: 150 },
        { field: 'lotNumber', header: 'Lote', width: 70 },
        { field: 'bidderName', header: 'Licitante', width: 180 },
        { field: 'bidValue', header: 'Valor', width: 110, format: 'currency' },
        { field: 'bidType', header: 'Tipo', width: 90 },
        { field: 'ipAddress', header: 'IP', width: 120 },
        { field: 'device', header: 'Dispositivo', width: 100 },
      ]
    ),
  },
  {
    id: 'RELATORIO_HABILITACOES',
    name: 'Relatório de Habilitações',
    description: 'Lista de licitantes habilitados por leilão.',
    category: 'OPERACIONAL',
    type: 'TABLE',
    icon: 'CheckCircle',
    availableFor: ['ADMIN', 'AUCTIONEER', 'ANALYST'],
    definition: createReportDefinition(
      'RELATORIO_HABILITACOES',
      'RELATÓRIO DE HABILITAÇÕES',
      'habilitations_report',
      [
        { field: 'auctionName', header: 'Leilão', width: 180 },
        { field: 'bidderName', header: 'Licitante', width: 200 },
        { field: 'cpfCnpj', header: 'CPF/CNPJ', width: 140 },
        { field: 'requestDate', header: 'Solicitação', width: 100, format: 'date' },
        { field: 'approvalDate', header: 'Aprovação', width: 100, format: 'date' },
        { field: 'status', header: 'Status', width: 100 },
        { field: 'approvedBy', header: 'Aprovado Por', width: 150 },
      ]
    ),
  },
  {
    id: 'RELATORIO_VISITACOES',
    name: 'Relatório de Visitações',
    description: 'Agendamentos de visitas aos bens.',
    category: 'OPERACIONAL',
    type: 'TABLE',
    icon: 'MapPin',
    availableFor: ['ADMIN', 'AUCTIONEER', 'ANALYST'],
    definition: createReportDefinition(
      'RELATORIO_VISITACOES',
      'RELATÓRIO DE VISITAÇÕES',
      'visits_report',
      [
        { field: 'visitDate', header: 'Data Visita', width: 100, format: 'date' },
        { field: 'visitTime', header: 'Horário', width: 80 },
        { field: 'auctionName', header: 'Leilão', width: 150 },
        { field: 'lotNumber', header: 'Lote', width: 70 },
        { field: 'visitorName', header: 'Visitante', width: 180 },
        { field: 'phone', header: 'Telefone', width: 120 },
        { field: 'location', header: 'Local', width: 200 },
        { field: 'status', header: 'Status', width: 90 },
      ]
    ),
  },
  {
    id: 'RELATORIO_AUDITORIA',
    name: 'Relatório de Auditoria',
    description: 'Log de ações e alterações no sistema.',
    category: 'OPERACIONAL',
    type: 'TABLE',
    icon: 'Shield',
    availableFor: ['ADMIN'],
    definition: createReportDefinition(
      'RELATORIO_AUDITORIA',
      'RELATÓRIO DE AUDITORIA',
      'audit_log',
      [
        { field: 'timestamp', header: 'Data/Hora', width: 140, format: 'datetime' },
        { field: 'userName', header: 'Usuário', width: 150 },
        { field: 'action', header: 'Ação', width: 120 },
        { field: 'entity', header: 'Entidade', width: 100 },
        { field: 'entityId', header: 'ID', width: 80 },
        { field: 'changes', header: 'Alterações', width: 250 },
        { field: 'ipAddress', header: 'IP', width: 120 },
      ]
    ),
  },
];

// ============================================================================
// ALL TEMPLATES
// ============================================================================

export const ALL_REPORT_TEMPLATES: ReportTemplate[] = [
  ...JUDICIAL_TEMPLATES,
  ...EXTRAJUDICIAL_TEMPLATES,
  ...ADMIN_TEMPLATES,
  ...FINANCIAL_TEMPLATES,
  ...OPERATIONAL_TEMPLATES,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getTemplatesByCategory(category: ReportTemplate['category']): ReportTemplate[] {
  return ALL_REPORT_TEMPLATES.filter(t => t.category === category);
}

export function getTemplatesByRole(role: 'ADMIN' | 'AUCTIONEER' | 'ANALYST' | 'BIDDER'): ReportTemplate[] {
  return ALL_REPORT_TEMPLATES.filter(t => t.availableFor.includes(role));
}

export function getTemplateById(id: string): ReportTemplate | undefined {
  return ALL_REPORT_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByPhase(phase: string): ReportTemplate[] {
  return ALL_REPORT_TEMPLATES.filter(t => t.phase === phase);
}
