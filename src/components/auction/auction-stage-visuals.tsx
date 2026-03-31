/**
 * @fileoverview Helpers de estado visual para praças/leilões.
 * Centraliza o mapeamento de status para ícones, labels e classes visuais
 * usados na timeline de praças e nos formulários de cadastro.
 */
'use client';

import { Ban, CheckCircle2, Clock, DollarSign, FileText, Gavel, type LucideIcon, XCircle } from 'lucide-react';

export type StageTimelineStatus = 'completed' | 'active' | 'upcoming';

export type StageVisualState = 'draft' | 'scheduled' | 'open' | 'cancelled' | 'closed' | 'sold' | 'unsold';

export interface StageVisualConfig {
  label: string;
  icon: LucideIcon;
  chipClassName: string;
  badgeClassName: string;
}

const STAGE_VISUAL_CONFIG: Record<StageVisualState, StageVisualConfig> = {
  draft: {
    label: 'Rascunho',
    icon: FileText,
    chipClassName: 'chip-stage-visual-draft',
    badgeClassName: 'badge-stage-visual-draft',
  },
  scheduled: {
    label: 'Em breve',
    icon: Clock,
    chipClassName: 'chip-stage-visual-scheduled',
    badgeClassName: 'badge-stage-visual-scheduled',
  },
  open: {
    label: 'Aberto',
    icon: Gavel,
    chipClassName: 'chip-stage-visual-open',
    badgeClassName: 'badge-stage-visual-open',
  },
  cancelled: {
    label: 'Cancelado',
    icon: Ban,
    chipClassName: 'chip-stage-visual-cancelled',
    badgeClassName: 'badge-stage-visual-cancelled',
  },
  closed: {
    label: 'Encerrado',
    icon: CheckCircle2,
    chipClassName: 'chip-stage-visual-closed',
    badgeClassName: 'badge-stage-visual-closed',
  },
  sold: {
    label: 'Com venda',
    icon: DollarSign,
    chipClassName: 'chip-stage-visual-sold',
    badgeClassName: 'badge-stage-visual-sold',
  },
  unsold: {
    label: 'Sem venda',
    icon: XCircle,
    chipClassName: 'chip-stage-visual-unsold',
    badgeClassName: 'badge-stage-visual-unsold',
  },
};

function normalizeStatus(status?: string | null): string {
  return String(status || '').trim().toUpperCase();
}

function fallbackVisualState(stepStatus: StageTimelineStatus): StageVisualState {
  switch (stepStatus) {
    case 'active':
      return 'open';
    case 'completed':
      return 'closed';
    default:
      return 'scheduled';
  }
}

export function getStageVisualConfig(state: StageVisualState): StageVisualConfig {
  return STAGE_VISUAL_CONFIG[state];
}

export function getAuctionStageVisualState(stageStatus: string | undefined, stepStatus: StageTimelineStatus): StageVisualState {
  const normalized = normalizeStatus(stageStatus);

  if (normalized === 'RASCUNHO') {
    return 'draft';
  }

  if (normalized.includes('CANCEL')) {
    return 'cancelled';
  }

  if (normalized === 'ENCERRADO' || normalized === 'FINALIZADO') {
    return 'closed';
  }

  if (stepStatus === 'completed') {
    if (normalized === 'VENDIDO' || normalized === 'SOLD') {
      return 'sold';
    }

    if (normalized === 'NAO_VENDIDO' || normalized === 'UNSOLD') {
      return 'unsold';
    }

    return 'closed';
  }

  if (stepStatus === 'active') {
    return 'open';
  }

  if (stepStatus === 'upcoming') {
    return 'scheduled';
  }

  return fallbackVisualState(stepStatus);
}

export function getLotStageVisualState(
  lotStatus: string | undefined,
  stepStatus: StageTimelineStatus,
  isHighlighted: boolean,
  fallbackStageStatus?: string | undefined,
): StageVisualState {
  const normalized = normalizeStatus(lotStatus);

  if (!normalized) {
    return getAuctionStageVisualState(fallbackStageStatus, stepStatus);
  }

  if (normalized === 'RASCUNHO') {
    return 'draft';
  }

  if (normalized === 'CANCELADO' || normalized === 'RETIRADO') {
    return 'cancelled';
  }

  if (stepStatus === 'completed') {
    if (isHighlighted && (normalized === 'VENDIDO' || normalized === 'SOLD')) {
      return 'sold';
    }

    if (isHighlighted && (normalized === 'NAO_VENDIDO' || normalized === 'UNSOLD')) {
      return 'unsold';
    }

    return 'closed';
  }

  if (stepStatus === 'upcoming') {
    return 'scheduled';
  }

  if (normalized === 'VENDIDO' || normalized === 'SOLD') {
    return 'sold';
  }

  if (normalized === 'NAO_VENDIDO' || normalized === 'UNSOLD') {
    return 'unsold';
  }

  if (normalized === 'ENCERRADO') {
    return 'closed';
  }

  if (normalized === 'EM_BREVE' || normalized === 'AGUARDANDO') {
    return 'scheduled';
  }

  if (normalized === 'ABERTO_PARA_LANCES' || normalized === 'EM_PREGAO') {
    return 'open';
  }

  return fallbackVisualState(stepStatus);
}

export function getFormStageVisualState(stage: { name?: string; startDate?: Date | null; endDate?: Date | null }): StageVisualState {
  if (!stage.name || !stage.startDate || !stage.endDate) {
    return 'draft';
  }

  const now = Date.now();
  const start = new Date(stage.startDate).getTime();
  const end = new Date(stage.endDate).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 'draft';
  }

  if (end < now) {
    return 'closed';
  }

  if (start <= now && end >= now) {
    return 'open';
  }

  return 'scheduled';
}