
'use client';

import type { AuctionStage } from '@/types';
import { CalendarDays } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import React from 'react';

interface AuctionStagesTimelineProps {
  auctionOverallStartDate?: Date | null;
  stages: AuctionStage[];
}

export default function AuctionStagesTimeline({ auctionOverallStartDate, stages }: AuctionStagesTimelineProps) {
  const now = new Date();
  
  const processedStages = stages
    .map(stage => ({
      ...stage,
      endDate: stage.endDate ? new Date(stage.endDate as string) : null,
    }))
    .sort((a, b) => (a.endDate?.getTime() || 0) - (b.endDate?.getTime() || 0));

  let activeStageIndex = processedStages.findIndex(stage => stage.endDate && !isPast(stage.endDate));
  if (activeStageIndex === -1 && processedStages.length > 0) {
      // If all stages are in the past, consider the last one as "active" for styling purposes of what was the last step.
      const lastStage = processedStages[processedStages.length - 1];
      if (lastStage.endDate && isPast(lastStage.endDate)) {
        activeStageIndex = processedStages.length; // All are completed
      } else {
        activeStageIndex = processedStages.length - 1;
      }
  }


  return (
    <div>
        <h4 className="text-md font-semibold mb-3 flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary" />Linha do Tempo</h4>
        <div className="relative pl-3 space-y-0">
            {processedStages.map((stage, index) => {
                const isCompleted = stage.endDate ? isPast(stage.endDate) : false;
                const isActive = index === activeStageIndex;
                const isLast = index === processedStages.length - 1;
                
                return (
                    <div key={stage.name || index} className="relative pb-6">
                        {/* Timeline line */}
                        {!isLast && (
                            <div
                                className={cn(
                                "absolute left-[3px] top-2 h-full w-0.5",
                                (isCompleted || isActive) ? "bg-primary" : "bg-border"
                                )}
                            />
                        )}

                        {/* Timeline circle */}
                        <div className={cn(
                            "absolute left-0 top-1.5 h-2 w-2 rounded-full",
                            isCompleted ? "bg-primary" : (isActive ? "bg-primary ring-2 ring-primary/30" : "bg-border")
                        )} />

                        {/* Content */}
                        <div className="pl-6">
                            <p className={cn(
                                "text-sm font-semibold",
                                isCompleted ? "text-muted-foreground" : "text-foreground",
                                isActive && "text-primary"
                            )}>
                                {stage.name || `Etapa ${index + 1}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {stage.endDate ? format(stage.endDate, "dd/MM/yyyy 'às' HH:mm'h'", { locale: ptBR }) : 'Data indefinida'}
                            </p>
                        </div>
                    </div>
                );
            })}
             {processedStages.length === 0 && (
                <p className="text-xs text-muted-foreground">Datas das etapas não disponíveis.</p>
            )}
        </div>
    </div>
  );
}
