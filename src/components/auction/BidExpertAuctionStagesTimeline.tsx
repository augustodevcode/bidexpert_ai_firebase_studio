// src/components/auction/BidExpertAuctionStagesTimeline.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, Loader2, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { isPast, format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AuctionStage, Auction, Lot } from '@/types';

interface BidExpertAuctionStagesTimelineProps {
  stages?: Partial<AuctionStage>[];
  variant?: 'compact' | 'extended';
  className?: string;
  auctionOverallStartDate?: Date;
  auction?: Auction;
  lot?: Lot;
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
  const auctionOverallStartDate = propStartDate || (auction?.auctionDate ? new Date(auction.auctionDate) : undefined);

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

  const totalSteps = steps.length;
  const progress = totalSteps > 1 ? Math.max(0, (activeStep / (totalSteps - 1)) * 100) : 0;

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)} data-ai-id="bidexpert-auction-timeline">
      {steps.map((step, index) => {
        const isHighlighted = index === activeStep;
        const isCompleted = step.status === 'completed';
        
        return (
          <div 
            key={index}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border transition-colors",
              isHighlighted 
                ? "bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800" 
                : "bg-card border-transparent hover:bg-accent/50"
            )}
          >
            <div className="flex items-center gap-3">
               {/* Dot */}
               <div className={cn(
                 "h-2.5 w-2.5 rounded-full flex-shrink-0",
                 isHighlighted ? "bg-purple-500" : "bg-muted-foreground/30"
               )} />
               
               <div className="flex flex-col">
                 <span className={cn(
                   "text-sm font-semibold leading-none",
                   isHighlighted ? "text-foreground" : "text-muted-foreground",
                   isCompleted && "line-through opacity-70"
                 )}>
                   {step.label}
                 </span>
                 <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                        "text-xs text-muted-foreground",
                        isCompleted && "line-through opacity-70"
                    )}>
                    {step.startDate ? format(step.startDate, "dd/MM - HH:mm", { locale: ptBR }) : 'A definir'}
                    </span>
                    {step.status === 'upcoming' && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                            Próxima
                        </span>
                    )}
                    {step.status === 'active' && (
                        <span className="text-[10px] font-medium text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">
                            Em andamento
                        </span>
                    )}
                 </div>
               </div>
            </div>
            
            <div className="text-right">
               <span className={cn(
                 "text-sm font-bold",
                 isHighlighted ? "text-foreground" : "text-muted-foreground",
                 isCompleted && "line-through opacity-70"
               )}>
                 {step.price 
                   ? `R$ ${step.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                   : (step.discountText || 'R$ --')
                 }
               </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
