// src/components/auction/BidExpertAuctionStagesTimeline.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, Loader2, AlertCircle, Clock } from 'lucide-react';
import { isPast, format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AuctionStage } from '@/types';

interface BidExpertAuctionStagesTimelineProps {
  stages: Partial<AuctionStage>[];
  variant?: 'compact' | 'extended';
  className?: string;
  auctionOverallStartDate: Date; 
}

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

  if (!isClient || !stages || stages.length === 0) {
    return <div className="h-24 w-full animate-pulse rounded-md bg-muted/20" />;
  }

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

  let activeStep = steps.findIndex(s => s.status === 'active');
  if (activeStep === -1) {
    const firstUpcoming = steps.findIndex(s => s.status === 'upcoming');
    activeStep = firstUpcoming === -1 ? steps.length - 1 : firstUpcoming - 1;
  }

  const totalSteps = steps.length;
  const progress = totalSteps > 1 ? Math.max(0, (activeStep / (totalSteps - 1)) * 100) : 0;

  return (
    <div className={cn("relative flex flex-col md:items-center md:mt-8 w-full", className)} data-ai-id="auction-card-timeline">
      {/* Desktop Horizontal Line (Background) */}
      <div 
        data-orientation="horizontal" 
        role="none" 
        className="absolute -top-8 left-0 hidden h-px w-full bg-border md:block" 
      />
      
      {/* Desktop Progress Line (Foreground) */}
      <div 
        className="absolute -top-[32px] left-0 hidden h-0.5 bg-primary transition-all duration-500 md:block" 
        style={{ width: `${progress}%` }}
      />

      <div 
        className="grid gap-6" 
        style={{ 
          gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` 
        }}
      >
        {steps.map((step, index) => {
          const isCompleted = index <= activeStep;
          const isActive = step.status === 'active';
          const isLast = index === totalSteps - 1;
          
          return (
            <div key={index} className="relative space-y-2">
              {/* Mobile Vertical Line (Background) */}
              {!isLast && (
                <div 
                  data-orientation="vertical" 
                  role="none" 
                  className="absolute left-0 top-6 block h-full w-px bg-border md:hidden" 
                />
              )}
              
              {/* Dot/Icon */}
              <div className={cn(
                "absolute -left-[11px] top-0 z-10 mb-5 flex size-6 items-center justify-center rounded-full border-2 transition-colors duration-300 md:-top-[42px] md:left-0",
                isActive 
                  ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : isCompleted 
                    ? "border-primary bg-background text-primary" 
                    : "border-muted bg-background text-muted-foreground"
              )}>
                {step.status === 'completed' ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : step.status === 'active' ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <div className={cn("size-1.5 rounded-full bg-current")} />
                )}
              </div>

              {/* Content */}
              <div className="pl-7 md:pl-0 md:pt-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {step.startDate ? format(step.startDate, "d MMM, yyyy", { locale: ptBR }) : 'A definir'}
                </p>
                <h2 className={cn(
                  "text-sm font-bold tracking-tight mt-0.5",
                  isActive ? "text-primary" : "text-foreground"
                )}>
                  {step.label}
                </h2>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {step.status === 'active' 
                    ? 'Em andamento' 
                    : step.status === 'completed' 
                      ? 'Encerrado' 
                      : 'Aguardando início'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
