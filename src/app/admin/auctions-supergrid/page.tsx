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
import { z } from 'zod';

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
    },
    {
      id: 'endDate',
      accessorKey: 'endDate',
      header: 'Encerramento',
      type: 'datetime',
      width: 170,
      sortable: true,
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
      formats: ['excel', 'csv'],
      excel: { includeStyles: true, sheetName: 'Leilões' },
      csv: { delimiter: ';', encoding: 'utf-8-sig', includeHeaders: true },
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
