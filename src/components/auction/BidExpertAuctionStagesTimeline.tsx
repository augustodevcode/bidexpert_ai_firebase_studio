/**
 * @fileoverview Componente unificado para visualização das etapas/praças de um leilão.
 * Suporta variantes de renderização (compact/extended) e estado vazio quando não há etapas.
 */
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { format, isPast, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AuctionStage, Auction, Lot } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BidExpertAuctionStagesTimelineProps {
  stages?: Partial<AuctionStage>[];
  variant?: 'compact' | 'extended';
  className?: string;
  auctionOverallStartDate?: Date;
  auction?: Auction;
  lot?: Lot;
}

type StepStatus = 'completed' | 'active' | 'upcoming';

interface TimelineStep {
  key: string;
  label: string;
  startDate: Date | null;
  endDate: Date | null;
  status: StepStatus;
  price: number | null;
  discountText: string | null;
}

function formatDate(date: Date | null) {
  if (!date) return 'A definir';
  return format(date, 'dd/MM - HH:mm', { locale: ptBR });
}

function formatMoney(value: number | null) {
  if (!value && value !== 0) return 'R$ --';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export default function BidExpertAuctionStagesTimeline({
  stages: propStages,
  variant = 'compact',
  className,
  auctionOverallStartDate: propStartDate,
  auction,
  lot
}: BidExpertAuctionStagesTimelineProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const stages = propStages || auction?.auctionStages || [];

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

  const steps: TimelineStep[] = stages.map((stage, index) => {
    const startDate = stage.startDate ? new Date(stage.startDate) : null;
    const endDate = stage.endDate ? new Date(stage.endDate) : null;
    let status: StepStatus = 'upcoming';

    if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
      if (isPast(endDate)) {
        status = 'completed';
      } else if (isPast(startDate) && !isPast(endDate)) {
        status = 'active';
      }
    }

    // Calculate price if lot is provided, or discount text if not
    let price: number | null = null;
    let discountText: string | null = null;

    if (lot) {
        const stagePrice = lot.lotPrices?.find(lp => lp.auctionStageId === stage.id);
        price = stagePrice?.initialBid || (index === 0 ? lot.initialPrice : lot.secondInitialPrice) || stage.initialPrice || null;
    } else if (auction) {
        // Auction view: show discount indication
        if (index === 0) {
            discountText = "Valor da Avaliação";
        } else {
            // TODO: Retrieve actual discount percentage from auction configuration if available
            // For now, we assume a standard 50% discount for the 2nd stage or display a generic message
            discountText = "50% de desconto"; 
        }
    }

    return {
      key: String(stage.id ?? `stage-${index}`),
      label: stage.name || `Etapa ${index + 1}`,
      startDate,
      endDate,
      status,
      price,
      discountText
    };
  });

  let activeStep = steps.findIndex(s => s.status === 'active');
  if (activeStep === -1) {
    // If no active step, find the first upcoming step to highlight as "next"
    const firstUpcoming = steps.findIndex(s => s.status === 'upcoming');
    // If we have an upcoming step, highlight it. If not (all completed), highlight the last one.
    activeStep = firstUpcoming !== -1 ? firstUpcoming : steps.length - 1;
  }

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
                      <div className="text-xs font-semibold">
                        {step.price !== null ? formatMoney(step.price) : (step.discountText || 'R$ --')}
                      </div>
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

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)} data-ai-id="bidexpert-auction-timeline" data-variant="extended">
      {steps.map((step, index) => {
        const isHighlighted = index === activeStep;
        const isCompleted = step.status === 'completed';

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
              <div
                className={cn(
                  'h-2.5 w-2.5 rounded-full flex-shrink-0',
                  isHighlighted ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              />

              <div className="flex flex-col">
                <span
                  className={cn(
                    'text-sm font-semibold leading-none',
                    isHighlighted ? 'text-foreground' : 'text-muted-foreground',
                    isCompleted && 'line-through opacity-70'
                  )}
                >
                  {step.label}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn('text-xs text-muted-foreground', isCompleted && 'line-through opacity-70')}>
                    {formatDate(step.startDate)}
                  </span>
                  {step.status === 'upcoming' && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Próxima</span>
                  )}
                  {step.status === 'active' && (
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Em andamento</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span
                className={cn(
                  'text-sm font-bold',
                  isHighlighted ? 'text-foreground' : 'text-muted-foreground',
                  isCompleted && 'line-through opacity-70'
                )}
              >
                {step.price !== null ? formatMoney(step.price) : (step.discountText || 'R$ --')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
