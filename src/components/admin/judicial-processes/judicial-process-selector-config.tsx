/**
 * @fileoverview Configuração compartilhada do seletor de processos judiciais.
 * Centraliza as colunas e a montagem de opções ricas para evitar seleções ambíguas.
 */

import type { JudicialProcess } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function formatDateTime(value?: string | Date | null): string {
  if (!value) {
    return '—';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return dateTimeFormatter.format(parsed);
}

function formatEnumLabel(value?: string | null): string {
  if (!value) {
    return '—';
  }

  return value
    .split('_')
    .filter(Boolean)
    .map((token) => token.charAt(0) + token.slice(1).toLowerCase())
    .join(' ');
}

function formatParties(process: JudicialProcess): string {
  if (!process.parties?.length) {
    return '—';
  }

  return process.parties
    .map((party) => `${formatEnumLabel(party.partyType)}: ${party.name}`)
    .join(' | ');
}

function formatCount(value?: number | null): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export type JudicialProcessSelectorOption = {
  value: string;
  label: string;
  publicId: string;
  processNumber: string;
  sellerName: string;
  branchName: string;
  districtName: string;
  courtName: string;
  partiesSummary: string;
  isElectronicLabel: string;
  propertyMatricula: string;
  propertyRegistrationNumber: string;
  actionTypeLabel: string;
  actionDescription: string;
  actionCnjCode: string;
  assetCount: number;
  lotCount: number;
  createdAtLabel: string;
  updatedAtLabel: string;
};

export function buildJudicialProcessSelectorOptions(
  processes: JudicialProcess[],
): JudicialProcessSelectorOption[] {
  return processes.map((process) => ({
    value: process.id,
    label: process.processNumber,
    publicId: process.publicId,
    processNumber: process.processNumber,
    sellerName: process.sellerName || 'Sem comitente vinculado',
    branchName: process.branchName || 'Vara não informada',
    districtName: process.districtName || 'Comarca não informada',
    courtName: process.courtName || 'Tribunal não informado',
    partiesSummary: formatParties(process),
    isElectronicLabel: process.isElectronic ? 'Sim' : 'Não',
    propertyMatricula: process.propertyMatricula || '—',
    propertyRegistrationNumber: process.propertyRegistrationNumber || '—',
    actionTypeLabel: formatEnumLabel(process.actionType),
    actionDescription: process.actionDescription || '—',
    actionCnjCode: process.actionCnjCode || '—',
    assetCount: formatCount(process.assetCount),
    lotCount: formatCount(process.lotCount),
    createdAtLabel: formatDateTime(process.createdAt),
    updatedAtLabel: formatDateTime(process.updatedAt),
  }));
}

export const judicialProcessSelectorColumns: ColumnDef<JudicialProcessSelectorOption>[] = [
  {
    accessorKey: 'processNumber',
    header: () => <span data-ai-id="judicial-process-selector-header-process-number">Processo</span>,
    cell: ({ row }) => <div className="min-w-[220px] font-medium">{row.original.processNumber}</div>,
  },
  {
    accessorKey: 'sellerName',
    header: () => <span data-ai-id="judicial-process-selector-header-seller">Comitente</span>,
    cell: ({ row }) => <div className="min-w-[220px] text-sm">{row.original.sellerName}</div>,
  },
  {
    accessorKey: 'branchName',
    header: () => <span data-ai-id="judicial-process-selector-header-branch">Vara</span>,
    cell: ({ row }) => <div className="min-w-[220px] text-sm">{row.original.branchName}</div>,
  },
  {
    accessorKey: 'districtName',
    header: () => <span data-ai-id="judicial-process-selector-header-district">Comarca</span>,
    cell: ({ row }) => <div className="min-w-[180px] text-sm">{row.original.districtName}</div>,
  },
  {
    accessorKey: 'courtName',
    header: () => <span data-ai-id="judicial-process-selector-header-court">Tribunal</span>,
    cell: ({ row }) => <div className="min-w-[220px] text-sm">{row.original.courtName}</div>,
  },
  {
    accessorKey: 'partiesSummary',
    header: () => <span data-ai-id="judicial-process-selector-header-parties">Partes</span>,
    cell: ({ row }) => <div className="min-w-[260px] text-sm">{row.original.partiesSummary}</div>,
  },
  {
    accessorKey: 'isElectronicLabel',
    header: () => <span data-ai-id="judicial-process-selector-header-electronic">Eletrônico</span>,
    cell: ({ row }) => <div className="min-w-[110px] text-sm">{row.original.isElectronicLabel}</div>,
  },
  {
    accessorKey: 'propertyMatricula',
    header: () => <span data-ai-id="judicial-process-selector-header-matricula">Matrícula</span>,
    cell: ({ row }) => <div className="min-w-[160px] text-sm">{row.original.propertyMatricula}</div>,
  },
  {
    accessorKey: 'propertyRegistrationNumber',
    header: () => <span data-ai-id="judicial-process-selector-header-registration">Registro</span>,
    cell: ({ row }) => <div className="min-w-[160px] text-sm">{row.original.propertyRegistrationNumber}</div>,
  },
  {
    accessorKey: 'actionTypeLabel',
    header: () => <span data-ai-id="judicial-process-selector-header-action-type">Tipo de ação</span>,
    cell: ({ row }) => <div className="min-w-[180px] text-sm">{row.original.actionTypeLabel}</div>,
  },
  {
    accessorKey: 'actionCnjCode',
    header: () => <span data-ai-id="judicial-process-selector-header-cnj">Cód. CNJ</span>,
    cell: ({ row }) => <div className="min-w-[130px] text-sm">{row.original.actionCnjCode}</div>,
  },
  {
    accessorKey: 'actionDescription',
    header: () => <span data-ai-id="judicial-process-selector-header-action-description">Descrição da ação</span>,
    cell: ({ row }) => <div className="min-w-[260px] text-sm">{row.original.actionDescription}</div>,
  },
  {
    accessorKey: 'assetCount',
    header: () => <span data-ai-id="judicial-process-selector-header-assets">Bens</span>,
    cell: ({ row }) => <div className="min-w-[90px] text-sm">{row.original.assetCount}</div>,
  },
  {
    accessorKey: 'lotCount',
    header: () => <span data-ai-id="judicial-process-selector-header-lots">Lotes</span>,
    cell: ({ row }) => <div className="min-w-[90px] text-sm">{row.original.lotCount}</div>,
  },
  {
    accessorKey: 'publicId',
    header: () => <span data-ai-id="judicial-process-selector-header-public-id">Public ID</span>,
    cell: ({ row }) => <div className="min-w-[160px] text-sm">{row.original.publicId}</div>,
  },
  {
    accessorKey: 'createdAtLabel',
    header: () => <span data-ai-id="judicial-process-selector-header-created-at">Criado em</span>,
    cell: ({ row }) => <div className="min-w-[150px] text-sm">{row.original.createdAtLabel}</div>,
  },
  {
    accessorKey: 'updatedAtLabel',
    header: () => <span data-ai-id="judicial-process-selector-header-updated-at">Atualizado em</span>,
    cell: ({ row }) => <div className="min-w-[150px] text-sm">{row.original.updatedAtLabel}</div>,
  },
];
