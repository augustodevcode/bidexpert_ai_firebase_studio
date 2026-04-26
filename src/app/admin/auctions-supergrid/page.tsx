/**
 * @fileoverview Página de teste do SuperGrid com entidade Auction.
 * Demonstra TODAS as funcionalidades do componente:
 * paginação, multi-sort, busca, query builder, agrupamento,
 * exportação, edição modal/inline, seleção em lote, visibilidade de colunas,
 * densidade, row actions, formatação por tipo, RBAC, freeze panes,
 * destaque de linhas/colunas e internacionalização (pt-BR).
 */
'use client';

import { SuperGrid } from '@/components/super-grid';
import type { SuperGridConfig } from '@/components/super-grid';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { z } from 'zod';

type AuctionStageLike = {
  startDate?: string | Date | null;
  endDate?: string | Date | null;
};

type AuctionPartyLike = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

type AuctionGridRow = Record<string, unknown> & {
  auctionDate?: string | Date | null;
  endDate?: string | Date | null;
  AuctionStage?: AuctionStageLike[];
  auctionStages?: AuctionStageLike[];
  Auctioneer?: AuctionPartyLike | null;
  Seller?: AuctionPartyLike | null;
  totalLots?: number | null;
  visits?: number | null;
  initialOffer?: number | null;
  achievedRevenue?: number | null;
};

const auctionDateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;

  const candidate = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function getAuctionStages(row: AuctionGridRow): AuctionStageLike[] {
  if (Array.isArray(row.auctionStages)) {
    return row.auctionStages;
  }

  if (Array.isArray(row.AuctionStage)) {
    return row.AuctionStage;
  }

  return [];
}

function getDerivedAuctionDates(row: AuctionGridRow): { auctionDate: Date | null; endDate: Date | null } {
  const stages = getAuctionStages(row);
  const stageStarts = stages
    .map(stage => toDateOrNull(stage.startDate))
    .filter((value): value is Date => value instanceof Date)
    .sort((left, right) => left.getTime() - right.getTime());
  const stageEnds = stages
    .map(stage => toDateOrNull(stage.endDate))
    .filter((value): value is Date => value instanceof Date)
    .sort((left, right) => left.getTime() - right.getTime());

  return {
    auctionDate: stageStarts[0] ?? toDateOrNull(row.auctionDate),
    endDate: stageEnds.at(-1) ?? toDateOrNull(row.endDate),
  };
}

function formatAuctionDate(value: Date | null): string {
  return value ? auctionDateTimeFormatter.format(value) : '—';
}

function toSafeNumber(value: unknown): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getAuctionAnalytics(row: AuctionGridRow) {
  const totalLots = toSafeNumber(row.totalLots);
  const visits = toSafeNumber(row.visits);
  const initialOffer = toSafeNumber(row.initialOffer);
  const achievedRevenue = toSafeNumber(row.achievedRevenue);

  return {
    stagesCount: getAuctionStages(row).length,
    visitsPerLot: totalLots > 0 ? visits / totalLots : null,
    averageTicket: totalLots > 0 ? achievedRevenue / totalLots : null,
    revenueCoverage: initialOffer > 0 ? (achievedRevenue / initialOffer) * 100 : null,
  };
}

function AuctionPartyHoverCell({
  row,
  value,
  relationKey,
  dataAiId,
}: {
  row: AuctionGridRow;
  value: unknown;
  relationKey: 'Auctioneer' | 'Seller';
  dataAiId: string;
}) {
  const party = row[relationKey] as AuctionPartyLike | null | undefined;
  const name = String(party?.name || value || '—');
  const email = party?.email || 'Não informado';
  const phone = party?.phone || 'Não informado';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="text-left underline decoration-dotted underline-offset-4"
            data-ai-id={dataAiId}
          >
            {name}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs px-3 py-2">
          <div className="space-y-1">
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">E-mail: {email}</p>
            <p className="text-xs text-muted-foreground">Telefone: {phone}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AuctionAnalyticsCell({ row }: { row: AuctionGridRow; value: unknown }) {
  const analytics = getAuctionAnalytics(row);

  return (
    <div className="space-y-1" data-ai-id="auctions-supergrid-analytics-cell">
      <Badge variant="secondary">
        Cobertura {analytics.revenueCoverage !== null ? `${analytics.revenueCoverage.toFixed(0)}%` : '—'}
      </Badge>
      <div className="space-y-0.5 text-xs text-muted-foreground">
        <p>
          {analytics.visitsPerLot !== null
            ? `${analytics.visitsPerLot.toFixed(1)} visitas/lote`
            : 'Sem visitas por lote'}
        </p>
        <p>
          {analytics.averageTicket !== null
            ? `Ticket médio ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(analytics.averageTicket)}`
            : 'Sem ticket médio'}
        </p>
        <p>{analytics.stagesCount} praça(s)</p>
      </div>
    </div>
  );
}

/** Mapeamento de status para label + cor */
const auctionStatusOptions = [
  { value: 'RASCUNHO', label: 'Rascunho', color: '#94a3b8' },
  { value: 'EM_VALIDACAO', label: 'Em Validação', color: '#f59e0b' },
  { value: 'EM_AJUSTE', label: 'Em Ajuste', color: '#f97316' },
  { value: 'EM_PREPARACAO', label: 'Em Preparação', color: '#8b5cf6' },
  { value: 'EM_BREVE', label: 'Em Breve', color: '#3b82f6' },
  { value: 'ABERTO', label: 'Aberto', color: '#22c55e' },
  { value: 'ABERTO_PARA_LANCES', label: 'Aberto p/ Lances', color: '#10b981' },
  { value: 'EM_PREGAO', label: 'Em Pregão', color: '#06b6d4' },
  { value: 'ENCERRADO', label: 'Encerrado', color: '#6366f1' },
  { value: 'FINALIZADO', label: 'Finalizado', color: '#64748b' },
  { value: 'CANCELADO', label: 'Cancelado', color: '#ef4444' },
  { value: 'SUSPENSO', label: 'Suspenso', color: '#dc2626' },
];

const auctionTypeOptions = [
  { value: 'JUDICIAL', label: 'Judicial' },
  { value: 'EXTRAJUDICIAL', label: 'Extrajudicial' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'PARTICULAR', label: 'Particular' },
];

const auctionMethodOptions = [
  { value: 'STANDARD', label: 'Padrão' },
  { value: 'DUTCH', label: 'Holandês' },
  { value: 'ENGLISH', label: 'Inglês' },
  { value: 'SEALED_BID', label: 'Licitação' },
];

/** Configuração declarativa completa do grid de Leilões */
const auctionsGridConfig: SuperGridConfig = {
  id: 'auctions-supergrid',
  title: 'Leilões',
  entity: 'Auction',
  bigIntFields: ['id', 'tenantId', 'auctioneerId', 'sellerId', 'cityId', 'stateId', 'categoryId'],

  columns: [
    {
      id: 'id',
      accessorKey: 'id',
      header: 'ID',
      type: 'number',
      width: 80,
      sortable: true,
      filterable: false,
      visible: false,
    },
    {
      id: 'publicId',
      accessorKey: 'publicId',
      header: 'Código',
      type: 'string',
      width: 120,
      sortable: true,
      filterable: true,
      pinned: 'left',
    },
    {
      id: 'title',
      accessorKey: 'title',
      header: 'Título',
      type: 'string',
      width: 280,
      sortable: true,
      filterable: true,
      editable: true,
      pinned: 'left',
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      type: 'select',
      width: 160,
      sortable: true,
      filterable: true,
      groupable: true,
      editable: true,
      selectOptions: auctionStatusOptions,
    },
    {
      id: 'auctionType',
      accessorKey: 'auctionType',
      header: 'Tipo',
      type: 'select',
      width: 140,
      sortable: true,
      filterable: true,
      groupable: true,
      editable: true,
      selectOptions: auctionTypeOptions,
    },
    {
      id: 'auctionMethod',
      accessorKey: 'auctionMethod',
      header: 'Modalidade',
      type: 'select',
      width: 130,
      sortable: true,
      groupable: true,
      selectOptions: auctionMethodOptions,
    },
    {
      id: 'auctionDate',
      accessorKey: 'auctionDate',
      header: 'Data Leilão',
      type: 'datetime',
      width: 170,
      sortable: true,
      editable: true,
      relation: {
        relationName: 'AuctionStage',
        displayField: 'startDate',
        valueField: 'id',
      },
      Cell: ({ row }) => {
        const derivedDates = getDerivedAuctionDates(row as AuctionGridRow);
        return <span>{formatAuctionDate(derivedDates.auctionDate)}</span>;
      },
    },
    {
      id: 'endDate',
      accessorKey: 'endDate',
      header: 'Encerramento',
      type: 'datetime',
      width: 170,
      sortable: true,
      Cell: ({ row }) => {
        const derivedDates = getDerivedAuctionDates(row as AuctionGridRow);
        return <span>{formatAuctionDate(derivedDates.endDate)}</span>;
      },
    },
    {
      id: 'totalLots',
      accessorKey: 'totalLots',
      header: 'Lotes',
      type: 'number',
      width: 80,
      sortable: true,
      aggregable: true,
      aggregationFn: 'sum',
      align: 'center',
    },
    {
      id: 'initialOffer',
      accessorKey: 'initialOffer',
      header: 'Lance Inicial',
      type: 'currency',
      width: 150,
      sortable: true,
      aggregable: true,
      aggregationFn: 'sum',
      format: { currencyCode: 'BRL', decimalPlaces: 2 },
    },
    {
      id: 'achievedRevenue',
      accessorKey: 'achievedRevenue',
      header: 'Receita',
      type: 'currency',
      width: 150,
      sortable: true,
      aggregable: true,
      aggregationFn: 'sum',
      format: { currencyCode: 'BRL', decimalPlaces: 2 },
    },
    {
      id: 'analyticsSummary',
      accessorKey: 'analyticsSummary',
      header: 'Analytics',
      type: 'string',
      width: 220,
      sortable: false,
      filterable: false,
      groupable: false,
      Cell: ({ row, value }) => <AuctionAnalyticsCell row={row as AuctionGridRow} value={value} />,
    },
    {
      id: 'visits',
      accessorKey: 'visits',
      header: 'Visitas',
      type: 'number',
      width: 90,
      sortable: true,
      aggregable: true,
      aggregationFn: 'sum',
      align: 'center',
    },
    {
      id: 'auctioneerName',
      accessorKey: 'Auctioneer.name',
      header: 'Leiloeiro',
      type: 'string',
      width: 200,
      sortable: false,
      filterable: true,
      groupable: true,
      relation: {
        relationName: 'Auctioneer',
        displayField: 'name',
        valueField: 'id',
      },
      Cell: ({ row, value }) => (
        <AuctionPartyHoverCell
          row={row as AuctionGridRow}
          value={value}
          relationKey="Auctioneer"
          dataAiId="auctions-supergrid-auctioneer-hover"
        />
      ),
    },
    {
      id: 'sellerName',
      accessorKey: 'Seller.name',
      header: 'Comitente',
      type: 'string',
      width: 200,
      sortable: false,
      filterable: true,
      relation: {
        relationName: 'Seller',
        displayField: 'name',
        valueField: 'id',
      },
      Cell: ({ row, value }) => (
        <AuctionPartyHoverCell
          row={row as AuctionGridRow}
          value={value}
          relationKey="Seller"
          dataAiId="auctions-supergrid-seller-hover"
        />
      ),
    },
    {
      id: 'cityName',
      accessorKey: 'City.name',
      header: 'Cidade',
      type: 'string',
      width: 150,
      sortable: false,
      filterable: true,
      groupable: true,
      relation: {
        relationName: 'City',
        displayField: 'name',
        valueField: 'id',
      },
    },
    {
      id: 'stateUf',
      accessorKey: 'State.uf',
      header: 'UF',
      type: 'string',
      width: 60,
      sortable: false,
      groupable: true,
      relation: {
        relationName: 'State',
        displayField: 'uf',
        valueField: 'id',
      },
    },
    {
      id: 'categoryName',
      accessorKey: 'LotCategory.name',
      header: 'Categoria',
      type: 'string',
      width: 150,
      sortable: false,
      groupable: true,
      relation: {
        relationName: 'LotCategory',
        displayField: 'name',
        valueField: 'id',
      },
    },
    {
      id: 'isFeaturedOnMarketplace',
      accessorKey: 'isFeaturedOnMarketplace',
      header: 'Destaque',
      type: 'boolean',
      width: 90,
      sortable: true,
      editable: true,
      align: 'center',
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Criado Em',
      type: 'datetime',
      width: 170,
      sortable: true,
      visible: false,
    },
  ],

  features: {
    pagination: {
      enabled: true,
      pageSize: 25,
      pageSizeOptions: [10, 25, 50, 100, 500],
    },
    sorting: {
      enabled: true,
      multiSort: true,
    },
    filtering: {
      quickFilter: true,
      columnFilters: true,
      queryBuilder: {
        enabled: true,
        allowNestedGroups: true,
        maxDepth: 3,
        fields: [
          { name: 'title', label: 'Título', type: 'string' },
          { name: 'publicId', label: 'Código', type: 'string' },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            valueEditorType: 'select',
            values: auctionStatusOptions.map(s => ({ name: s.value, label: s.label })),
          },
          {
            name: 'auctionType',
            label: 'Tipo',
            type: 'select',
            valueEditorType: 'select',
            values: auctionTypeOptions.map(t => ({ name: t.value, label: t.label })),
          },
          { name: 'auctionDate', label: 'Data Leilão', type: 'date' },
          { name: 'endDate', label: 'Data Encerramento', type: 'date' },
          { name: 'totalLots', label: 'Total de Lotes', type: 'number' },
          { name: 'initialOffer', label: 'Lance Inicial', type: 'currency' },
          { name: 'visits', label: 'Visitas', type: 'number' },
          { name: 'isFeaturedOnMarketplace', label: 'Destaque', type: 'boolean' },
        ],
      },
    },
    grouping: {
      enabled: true,
      showAggregates: true,
      aggregateFunctions: ['sum', 'avg', 'count'],
    },
    editing: {
      enabled: true,
      mode: 'cell',
      allowAdd: true,
      allowDelete: true,
      allowBulkDelete: true,
      confirmDelete: true,
      validationSchema: z.object({
        title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
        status: z.string().optional(),
        auctionType: z.string().optional(),
        auctionDate: z.string().optional().nullable(),
        totalLots: z.coerce.number().min(0).optional(),
        initialOffer: z.coerce.number().min(0).optional().nullable(),
        isFeaturedOnMarketplace: z.boolean().optional(),
      }) as unknown as z.ZodSchema<unknown>,
    },
    export: {
      formats: ['excel', 'csv', 'pdf'],
      excel: { includeStyles: true, sheetName: 'Leilões' },
      csv: { delimiter: ';', encoding: 'utf-8-sig', includeHeaders: true },
      pdf: { title: 'Leilões SuperGrid', orientation: 'landscape' },
      maxRows: 50000,
    },
    selection: {
      enabled: true,
      mode: 'multiple',
      selectAllMode: 'page',
    },
    rowActions: [
      {
        id: 'view-details',
        label: 'Ver Detalhes',
        icon: 'eye',
        onClick: (row: Record<string, unknown>) => {
          window.open(`/admin/auctions/${row.id}`, '_blank');
        },
      },
    ],
  },

  behavior: {
    virtualizeRows: false,
    virtualizeColumns: false,
    stickyHeader: true,
    resizableColumns: true,
    reorderableColumns: false,
    autoRefresh: 0,
  },

  // Freeze panes (colunas fixadas à esquerda)
  freezePanes: {
    enabled: true,
    showDividerShadow: true,
  },

  // Destaque de linhas/colunas
  highlight: {
    activeRow: true,
    stripedRows: true,
    columnHover: true,
    rules: [
      {
        condition: (row: Record<string, unknown>) => row.status === 'CANCELADO' || row.status === 'SUSPENSO',
        className: 'bg-destructive/5',
      },
      {
        condition: (row: Record<string, unknown>) => row.status === 'ABERTO_PARA_LANCES',
        className: 'bg-green-50 dark:bg-green-950/20',
      },
    ],
  },

  permissions: {
    view: true,
    create: ['manage_all', 'auctions:write'],
    edit: ['manage_all', 'auctions:write'],
    delete: ['manage_all', 'auctions:delete'],
    export: ['manage_all', 'auctions:read'],
  },
};

export default function AuctionsSupergridPage() {
  return (
    <div className="space-y-4 p-4" data-ai-id="auctions-supergrid-page">
      <SuperGrid config={auctionsGridConfig} />
    </div>
  );
}
