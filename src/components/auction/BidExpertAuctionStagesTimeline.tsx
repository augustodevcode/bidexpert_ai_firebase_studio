/**
 * @fileoverview Componente unificado para visualização das etapas/praças de um leilão.
 * Suporta variantes de renderização (compact/extended/detailed) e estado vazio quando não há etapas.
 */
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AuctionStage, Auction, Lot } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { normalizeAuctionStages } from '@/lib/ui-helpers';
import { getAuctionStageTimelineStatus, type StageTimelineStatus } from '@/lib/auction-timing';
import {
  getAuctionStageVisualState,
  getLotStageVisualState,
  getStageVisualConfig,
  type StageVisualState,
} from '@/components/auction/auction-stage-visuals';

interface BidExpertAuctionStagesTimelineProps {
  stages?: Partial<AuctionStage>[];
  variant?: 'compact' | 'extended' | 'detailed';
  className?: string;
  auctionOverallStartDate?: Date;
  auction?: Auction;
  lot?: Lot;
  surface?: 'auction' | 'lot';
  showContextIcons?: boolean;
}

type StepStatus = StageTimelineStatus;

interface TimelineStep {
  key: string;
  label: string;
  startDate: Date | null;
  endDate: Date | null;
  status: StepStatus;
  price: number | null;
  stageStatus?: string;
  visualState: StageVisualState;
}

function formatDate(date: Date | null) {
  if (!date) return 'A definir';
  return format(date, 'dd/MM - HH:mm', { locale: ptBR });
}

function formatMoney(value: number | null) {
  if (value === null) return '';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export default function BidExpertAuctionStagesTimeline({
  stages: propStages,
  variant = 'compact',
  className,
  auctionOverallStartDate: propStartDate,
  auction,
  lot,
  surface,
  showContextIcons,
}: BidExpertAuctionStagesTimelineProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const stages = React.useMemo(
    () => normalizeAuctionStages(propStages || auction?.auctionStages || []),
    [propStages, auction?.auctionStages],
  );
  const resolvedSurface = surface || (lot ? 'lot' : 'auction');
  const shouldShowContextIcons = showContextIcons ?? variant !== 'compact';
  const shouldShowMonetaryValues = resolvedSurface === 'lot';

  if (!isClient) {
    return <div className="h-10 w-full animate-pulse rounded-md bg-muted/20" data-ai-id="bidexpert-auction-timeline-skeleton" />;
  }

  if (!stages || stages.length === 0) {
    return (
      <div
        className={cn(
          'w-full rounded-md border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground',
          className
        )}
        data-ai-id="bidexpert-auction-timeline-empty"
        data-variant={variant}
      >
        Praças não cadastradas
      </div>
    );
  }

  const baseSteps = stages.map((stage, index) => {
    const startDate = stage.startDate ? new Date(stage.startDate) : null;
    const endDate = stage.endDate ? new Date(stage.endDate) : null;
    const status: StepStatus = getAuctionStageTimelineStatus(stage);

    let price: number | null = null;

    if (lot) {
      const stagePrice = lot.lotPrices?.find(lp => lp.auctionStageId === stage.id);
    price = stagePrice?.initialBid ?? (index === 0 ? lot.initialPrice : lot.secondInitialPrice) ?? null;
    }

    return {
      key: String(stage.id ?? `stage-${index}`),
      label: stage.name || `Etapa ${index + 1}`,
      startDate,
      endDate,
      status,
      price,
      stageStatus: typeof stage.status === 'string' ? stage.status : undefined,
    };
  });

  let activeStep = baseSteps.findIndex(s => s.status === 'active');
  if (activeStep === -1) {
    const firstUpcoming = baseSteps.findIndex(s => s.status === 'upcoming');
    activeStep = firstUpcoming !== -1 ? firstUpcoming : baseSteps.length - 1;
  }

  const steps: TimelineStep[] = baseSteps.map((step, index) => ({
    ...step,
    visualState:
      resolvedSurface === 'lot'
        ? getLotStageVisualState(lot?.status, step.status, index === activeStep, step.stageStatus)
        : getAuctionStageVisualState(step.stageStatus, step.status),
  }));

  const activeStepData = steps[activeStep];

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <div
          className={cn('flex w-full flex-col gap-2', className)}
          data-ai-id="bidexpert-auction-timeline"
          data-variant="compact"
        >
          <div className="flex w-full items-center gap-1" data-ai-id="bidexpert-auction-timeline-compact-bar">
            {steps.map((step, index) => {
              const segmentClassName =
                step.status === 'active'
                  ? 'bg-primary'
                  : step.status === 'completed'
                    ? 'bg-muted-foreground/30'
                    : 'bg-muted';

              return (
                <Tooltip key={step.key}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn('h-2 flex-1 rounded-full', segmentClassName, index === activeStep && 'ring-2 ring-primary/30')}
                      data-ai-id={`bidexpert-auction-timeline-segment-${index}`}
                      aria-label={step.label}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[260px]">
                    <div className="space-y-1" data-ai-id={`bidexpert-auction-timeline-tooltip-${index}`}>
                      <div className="text-xs font-semibold">{step.label}</div>
                      <div className="text-xs text-muted-foreground">Início: {formatDate(step.startDate)}</div>
                      <div className="text-xs text-muted-foreground">Fim: {formatDate(step.endDate)}</div>
                      {shouldShowMonetaryValues && (
                        <div className="text-xs font-semibold">{formatMoney(step.price)}</div>
                      )}
                      {step.status === 'active' && (
                        <div className="text-[11px] font-medium text-primary">Etapa atual</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {activeStepData && (
            <div
              className="flex items-center justify-between text-[11px] text-muted-foreground"
              data-ai-id="bidexpert-auction-timeline-compact-meta"
            >
              <span className="truncate font-medium text-foreground">{activeStepData.label}</span>
              <span className="shrink-0">Fim: {formatDate(activeStepData.endDate)}</span>
            </div>
          )}
        </div>
      </TooltipProvider>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('relative flex flex-col gap-4 border-l border-border/70 pl-6', className)} data-ai-id="bidexpert-auction-timeline" data-variant="detailed">
        {steps.map((step, index) => {
          const isHighlighted = index === activeStep;
          const visual = getStageVisualConfig(step.visualState);
          const VisualIcon = visual.icon;

          return (
            <article key={step.key} className="relative" data-ai-id={`bidexpert-auction-timeline-step-${index}`}>
              <div className="absolute -left-[2.15rem] top-6 flex h-10 w-10 items-center justify-center rounded-full bg-background">
                <div className={cn(visual.chipClassName)} data-ai-id={`bidexpert-auction-stage-icon-${index}`}>
                  <VisualIcon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div
                className={cn(
                  'rounded-2xl border bg-card p-5 shadow-soft transition-colors',
                  isHighlighted ? 'border-primary/20 bg-primary/5 shadow-haze' : 'border-border/70 hover:bg-accent/30'
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">{step.label}</h3>
                      <Badge className={visual.badgeClassName} data-ai-id={`bidexpert-auction-stage-badge-${index}`}>
                        {visual.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground/85">Início:</span> {formatDate(step.startDate)}
                      <span className="mx-2 text-border">|</span>
                      <span className="font-medium text-foreground/85">Fim:</span> {formatDate(step.endDate)}
                    </p>
                  </div>
                  {shouldShowMonetaryValues && (
                    <div className="flex items-center gap-2 text-right">
                      <span className="text-2xl font-bold text-foreground">{formatMoney(step.price)}</span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)} data-ai-id="bidexpert-auction-timeline" data-variant="extended">
      {steps.map((step, index) => {
        const isHighlighted = index === activeStep;
        const isCompleted = step.status === 'completed';
        const visual = getStageVisualConfig(step.visualState);
        const VisualIcon = visual.icon;

        return (
          <div
            key={step.key}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border transition-colors',
              isHighlighted
                ? 'bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800'
                : 'bg-card border-transparent hover:bg-accent/50'
            )}
            data-ai-id={`bidexpert-auction-timeline-step-${index}`}
          >
            <div className="flex items-center gap-3">
              {shouldShowContextIcons ? (
                <div className={cn(visual.chipClassName, 'h-8 w-8')} data-ai-id={`bidexpert-auction-stage-icon-${index}`}>
                  <VisualIcon className="h-4 w-4" aria-hidden="true" />
                </div>
              ) : (
                <div
                  className={cn(
                    'h-2.5 w-2.5 rounded-full flex-shrink-0',
                    isHighlighted ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                />
              )}

              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-semibold leading-none',
                      isHighlighted ? 'text-foreground' : 'text-muted-foreground',
                      isCompleted && 'line-through opacity-70'
                    )}
                  >
                    {step.label}
                  </span>
                  {shouldShowContextIcons && (
                    <Badge className={visual.badgeClassName} data-ai-id={`bidexpert-auction-stage-badge-${index}`}>
                      {visual.label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn('text-xs text-muted-foreground', isCompleted && 'line-through opacity-70')}>
                    {formatDate(step.startDate)}
                  </span>
                  {!shouldShowContextIcons && step.status === 'upcoming' && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Próxima</span>
                  )}
                  {!shouldShowContextIcons && step.status === 'active' && (
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Em andamento</span>
                  )}
                </div>
              </div>
            </div>

            {shouldShowMonetaryValues && (
              <div className="text-right">
                <span
                  className={cn(
                    'text-sm font-bold',
                    isHighlighted ? 'text-foreground' : 'text-muted-foreground',
                    isCompleted && 'line-through opacity-70'
                  )}
                >
                  {formatMoney(step.price)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
