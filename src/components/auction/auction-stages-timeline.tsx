// src/components/auction/auction-stages-timeline.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Step, Stepper, StepLabel, StepIconProps } from '@/components/ui/stepper';
import { Check, Loader, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { isPast, format, isValid, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AuctionStage } from '@/types';

interface BidExpertStagesTimelineProps {
  stages: Partial<AuctionStage>[];
  variant?: 'compact' | 'extended';
  className?: string;
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


export default function BidExpertStagesTimeline({
  stages,
  variant = 'compact',
  className
}: BidExpertStagesTimelineProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="h-10 w-full animate-pulse rounded-md bg-muted" />;
  }

  const now = new Date();
  let activeStep = -1;

  const steps = stages.map((stage, index) => {
    const startDate = stage.startDate ? new Date(stage.startDate) : null;
    const endDate = stage.endDate ? new Date(stage.endDate) : null;
    let status: 'completed' | 'active' | 'upcoming' = 'upcoming';
    
    if (startDate && endDate) {
      if (isPast(endDate)) {
        status = 'completed';
      } else if (!isFuture(startDate) && isFuture(endDate)) {
        status = 'active';
        if (activeStep === -1) activeStep = index;
      }
    }
    
    // If no stage is active, set the first non-completed as active for visual cue
    if (activeStep === -1 && status === 'upcoming') {
        activeStep = index;
    }

    return {
      label: stage.name || `Etapa ${index + 1}`,
      startDate,
      endDate,
      status,
    };
  });
  
  // If all are completed, the active step is the last one
  if (activeStep === -1 && steps.length > 0) {
      activeStep = steps.length;
  }
  
  if (variant === 'compact') {
      return (
        <div className={cn("w-full", className)}>
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
