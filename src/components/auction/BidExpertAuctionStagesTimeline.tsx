// src/components/auction/BidExpertAuctionStagesTimeline.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Step, Stepper, StepLabel, StepIconProps } from '@/components/ui/stepper';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { isPast, format, isValid, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AuctionStage } from '@/types';

interface BidExpertAuctionStagesTimelineProps {
  stages: Partial<AuctionStage>[];
  variant?: 'compact' | 'extended';
  className?: string;
  auctionOverallStartDate: Date; // Adicionar data de início geral do leilão para referência
}

const CustomStepIcon = (props: StepIconProps & { status: 'completed' | 'active' | 'upcoming' }) => {
    const { active, completed, error, icon, status } = props;

    if (status === 'completed') {
        return <Check className="h-4 w-4" />;
    }
    if (status === 'active') {
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (error) {
        return <AlertCircle className="h-4 w-4" />;
    }
    return <div className="h-2.5 w-2.5 rounded-full bg-current" />;
};


export default function BidExpertAuctionStagesTimeline({
  stages,
  variant = 'compact',
  className,
  auctionOverallStartDate
}: BidExpertAuctionStagesTimelineProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const now = new Date();

  // Se não for cliente ainda, ou não houver stages, não renderize nada ou um placeholder
  if (!isClient || !stages || stages.length === 0) {
    return <div className="h-10 w-full animate-pulse rounded-md bg-muted" />;
  }

  // Lógica corrigida para determinar o status de cada etapa
  let activeStep = -1;

  const steps = stages.map((stage, index) => {
    const startDate = stage.startDate ? new Date(stage.startDate) : null;
    const endDate = stage.endDate ? new Date(stage.endDate) : null;
    let status: 'completed' | 'active' | 'upcoming' = 'upcoming';

    if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
      if (isPast(endDate)) {
        status = 'completed';
      } else if (isPast(startDate) && !isPast(endDate)) {
        status = 'active';
      }
    }
    return {
      label: stage.name || `Etapa ${index + 1}`,
      startDate,
      endDate,
      status,
    };
  });

  const activeStageIndex = steps.findIndex(s => s.status === 'active');
  const firstUpcomingIndex = steps.findIndex(s => s.status === 'upcoming');

  if (activeStageIndex !== -1) {
    activeStep = activeStageIndex;
  } else if (firstUpcomingIndex !== -1) {
    activeStep = firstUpcomingIndex;
  } else {
    // If all stages are completed, set the last one as active for display purposes
    activeStep = steps.length - 1;
  }
  
  if (variant === 'compact') {
      return (
        <div className={cn("container-auction-timeline w-full", className)} data-ai-id="auction-card-timeline">
             <Stepper activeStep={activeStep}>
                {steps.map((step, index) => (
                     <TooltipProvider key={index}>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Step>
                                    <StepLabel StepIconComponent={(props) => <CustomStepIcon {...props} status={step.status} />} />
                                </Step>
                             </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-semibold">{step.label}</p>
                                {step.endDate && <p className="text-xs">Fim: {format(step.endDate, 'dd/MM HH:mm')}</p>}
                            </TooltipContent>
                         </Tooltip>
                    </TooltipProvider>
                ))}
             </Stepper>
        </div>
      );
  }

  // Extended Variant
  return (
    <div className={cn("w-full", className)}>
      <Stepper orientation="vertical" activeStep={activeStep}>
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel StepIconComponent={(props) => <CustomStepIcon {...props} status={step.status} />}>
                <div className="flex flex-col text-left">
                    <span className="font-semibold">{step.label}</span>
                    <span className="text-xs text-muted-foreground">
                        {step.startDate ? format(step.startDate, 'dd/MM/yy HH:mm', { locale: ptBR }) : 'A definir'}
                        {' - '}
                        {step.endDate ? format(step.endDate, 'dd/MM/yy HH:mm', { locale: ptBR }) : ''}
                    </span>
                </div>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </div>
  );
}
