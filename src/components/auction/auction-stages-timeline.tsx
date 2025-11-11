// src/components/auction/auction-stages-timeline.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Step, Stepper, StepLabel, StepIconProps } from '@/components/ui/stepper';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { isPast, format, isValid, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AuctionStage } from '@/types';

interface AuctionStagesTimelineProps {
  stages: Partial<AuctionStage>[];
  variant?: 'compact' | 'extended';
  className?: string;
  auctionOverallStartDate: Date;
}

const CustomStepIcon = (props: StepIconProps & { status: 'completed' | 'active' | 'upcoming' }) => {
  const { status } = props;

  if (status === 'completed') {
    return <Check className="h-5 w-5 text-green-600" />;
  }
  if (status === 'active') {
    return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
  }
  return <div className="h-3 w-3 rounded-full bg-gray-300" />;
};

export default function AuctionStagesTimeline({
  stages,
  variant = 'compact',
  className,
  auctionOverallStartDate
}: AuctionStagesTimelineProps) {
  // Validar e garantir que temos stages válidos
  if (!stages || stages.length === 0) {
    return (
      <div className={cn("w-full p-4 text-center text-sm text-muted-foreground", className)}>
        Nenhuma etapa disponível
      </div>
    );
  }

  const steps = stages.map((stage, index) => {
    const startDate = stage.startDate ? new Date(stage.startDate) : null;
    const endDate = stage.endDate ? new Date(stage.endDate) : null;
    
    let status: 'completed' | 'active' | 'upcoming' = 'upcoming';

    // Validar datas
    if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
      if (isPast(endDate)) {
        status = 'completed';
      } else if (isPast(startDate) && isFuture(endDate)) {
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

  // Determinar índice ativo corretamente
  const activeStageIndex = steps.findIndex(s => s.status === 'active');
  const allCompleted = steps.every(s => s.status === 'completed');
  
  let activeStep = 0;
  if (activeStageIndex !== -1) {
    activeStep = activeStageIndex;
  } else if (allCompleted) {
    activeStep = steps.length - 1;
  } else {
    activeStep = steps.findIndex(s => s.status === 'upcoming');
    if (activeStep === -1) activeStep = 0;
  }


  if (variant === 'compact') {
    return (
      <div className={cn("w-full", className)} data-ai-id="auction-card-timeline">
        <Stepper activeStep={activeStep}>
          {steps.map((step, index) => (
            <TooltipProvider key={`stage-${index}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Step>
                      <StepLabel StepIconComponent={(props) => <CustomStepIcon {...props} status={step.status} />} />
                    </Step>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="font-semibold">{step.label}</div>
                  {step.startDate && <div className="text-xs">Início: {format(step.startDate, 'dd/MM HH:mm')}</div>}
                  {step.endDate && <div className="text-xs">Fim: {format(step.endDate, 'dd/MM HH:mm')}</div>}
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
    <div className={cn("w-full space-y-2", className)}>
      <Stepper orientation="vertical" activeStep={activeStep}>
        {steps.map((step, index) => (
          <Step key={`extended-stage-${index}`}>
            <StepLabel StepIconComponent={(props) => <CustomStepIcon {...props} status={step.status} />}>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm">{step.label}</span>
                <span className="text-xs text-muted-foreground">
                  {step.startDate ? format(step.startDate, 'dd/MM HH:mm', { locale: ptBR }) : 'A definir'}
                  {' — '}
                  {step.endDate ? format(step.endDate, 'dd/MM HH:mm', { locale: ptBR }) : 'Em aberto'}
                </span>
                <span className={cn("text-xs font-medium", {
                  'text-green-600': step.status === 'completed',
                  'text-blue-600': step.status === 'active',
                  'text-gray-500': step.status === 'upcoming',
                })}>
                  {step.status === 'completed' && '✓ Concluída'}
                  {step.status === 'active' && '⏳ Em andamento'}
                  {step.status === 'upcoming' && '○ Próxima'}
                </span>
              </div>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </div>
  );
}
