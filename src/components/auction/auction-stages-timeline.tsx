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
  
  if (!stages || stages.length === 0) {
    return (
      <div>
        <h4 className="text-md font-semibold mb-3 flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary" />Linha do Tempo</h4>
        <p className="text-xs text-muted-foreground">Nenhuma etapa definida para este leilão.</p>
      </div>
    );
  }

  const processedStages = stages
    .map(stage => ({
      ...stage,
      endDate: stage.endDate ? new Date(stage.endDate as string) : null,
    }))
    .sort((a, b) => (a.endDate?.getTime() || 0) - (b.endDate?.getTime() || 0));

  let activeStageIndex = processedStages.findIndex(stage => stage.endDate && !isPast(stage.endDate));
  
  // If all stages are in the past, mark the state as fully completed.
  if (activeStageIndex === -1 && processedStages.length > 0 && processedStages.every(s => s.endDate && isPast(s.endDate))) {
      activeStageIndex = processedStages.length; // Index beyond the last item indicates completion
  }


  return (
    <div>
        <h4 className="text-md font-semibold mb-4 flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary" />Linha do Tempo</h4>
        <div className="w-full">
            <div className="flex items-start">
                {processedStages.map((stage, index) => {
                    const isCompleted = stage.endDate ? isPast(stage.endDate) : false;
                    const isActive = index === activeStageIndex;
                    const isLast = index === processedStages.length - 1;

                    return (
                        <React.Fragment key={stage.name || index}>
                            {/* The Node (Dot + Text) */}
                            <div className="flex flex-col items-center flex-1 min-w-0 px-1">
                                <div className={cn(
                                    "h-3.5 w-3.5 rounded-full border-2 mb-1.5",
                                    isCompleted ? "bg-primary border-primary" : (isActive ? "bg-background border-primary ring-2 ring-primary/30" : "bg-background border-border")
                                )}/>
                                <p className={cn(
                                    "text-xs font-semibold text-center truncate w-full",
                                    isActive ? 'text-primary' : (isCompleted ? 'text-muted-foreground' : 'text-foreground')
                                )} title={stage.name || `Etapa ${index + 1}`}>
                                    {stage.name || `Etapa ${index + 1}`}
                                </p>
                                <p className="text-xs text-muted-foreground text-center">
                                    {stage.endDate ? format(stage.endDate, "dd/MM", { locale: ptBR }) : 'N/D'}
                                </p>
                                <p className="text-xs text-muted-foreground text-center">
                                    {stage.endDate ? format(stage.endDate, "HH:mm", { locale: ptBR }) : ''}
                                </p>
                            </div>

                            {/* The Connector Line */}
                            {!isLast && (
                                <div className={cn(
                                    "flex-auto h-0.5 mt-[5px]",
                                    (isCompleted || isActive) ? "bg-primary" : "bg-border"
                                )} />
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    </div>
  );
}