
'use client';

import type { AuctionStage, AnyTimestamp } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CalendarDays, Clock } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import React from 'react';

interface AuctionStagesTimelineProps {
  auctionOverallStartDate: Date | null | undefined;
  stages: AuctionStage[];
}

export default function AuctionStagesTimeline({ auctionOverallStartDate, stages }: AuctionStagesTimelineProps) {
  if ((!auctionOverallStartDate && (!stages || stages.length === 0)) || !stages ) {
    return (
      <Card className="mt-6 bg-secondary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Linha do Tempo das Praças</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Defina a data de início do leilão e adicione praças/etapas para visualizar a linha do tempo.
        </CardContent>
      </Card>
    );
  }

  const overallStart = auctionOverallStartDate ? new Date(auctionOverallStartDate) : null;
  const processedStages = stages.map(stage => ({
    ...stage,
    endDate: stage.endDate ? new Date(stage.endDate) : null,
  }));

  return (
    <Card className="mt-6 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Linha do Tempo das Praças</CardTitle>
        <CardDescription className="text-xs">Visualização cronológica das etapas do leilão.</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:space-x-2 overflow-x-auto pb-3 -mb-3">
          {/* Start of Auction */}
          {overallStart && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className={cn(
                "flex flex-col items-center p-3 border rounded-lg bg-green-50 dark:bg-green-900/30 min-w-[140px] text-center",
                isPast(overallStart) ? "border-dashed border-green-400" : "border-solid border-green-500 shadow-sm"
              )}>
                <CalendarDays className="h-5 w-5 text-green-700 dark:text-green-400 mb-1" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-400">Início do Leilão</span>
                <span className="text-xs text-muted-foreground mt-0.5">{format(overallStart, "dd/MM/yy HH:mm", { locale: ptBR })}</span>
              </div>
              {processedStages.length > 0 && <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />}
            </div>
          )}

          {processedStages.map((stage, index) => {
            const stageEndDate = stage.endDate;
            const stageIsPast = stageEndDate ? isPast(stageEndDate) : false;
            
            let stageStartDate: Date | null = null;
            if (index === 0 && overallStart) {
                stageStartDate = overallStart;
            } else if (index > 0 && processedStages[index - 1].endDate) {
                stageStartDate = processedStages[index - 1].endDate;
            }

            return (
              <React.Fragment key={(stage.name || `stage-${index}`) + index}>
                {index > 0 && overallStart && ( /* Arrow for mobile connecting to overall start if it's the first in list but overallStart exists */
                  <div className="sm:hidden h-4 flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                  </div>
                )}
                <div className={cn(
                  "flex flex-col p-3 rounded-lg border min-w-[200px] flex-shrink-0",
                  stageIsPast ? "bg-muted/50 border-dashed" : "bg-card border-border shadow-sm",
                )}>
                  <span className={cn(
                    "text-sm font-semibold mb-1 truncate",
                    stageIsPast ? "text-muted-foreground line-through" : "text-primary"
                  )} title={stage.name || `Etapa ${index + 1}`}>
                    {stage.name || `Etapa ${index + 1}`}
                  </span>
                   {stage.initialPrice !== undefined && (
                     <span className="text-xs text-muted-foreground">
                       Lance Inicial: R$ {stage.initialPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </span>
                   )}
                   {stageStartDate && (
                     <div className="flex items-center text-xs mt-1 text-muted-foreground/80">
                        <CalendarDays className={cn("h-3.5 w-3.5 mr-1.5", stageIsPast ? "" : "text-green-600")} />
                        <span>
                        Início: {format(stageStartDate, "dd/MM/yy HH:mm", { locale: ptBR })}
                        </span>
                    </div>
                   )}
                  <div className="flex items-center text-xs mt-1">
                    <Clock className={cn("h-3.5 w-3.5 mr-1.5", stageIsPast ? "text-muted-foreground/70" : "text-red-600")} />
                    <span className={cn(stageIsPast ? "text-muted-foreground/80" : "text-red-700 font-medium")}>
                      Fim: {stageEndDate ? format(stageEndDate, "dd/MM/yy HH:mm", { locale: ptBR }) : "Não definido"}
                    </span>
                  </div>
                </div>
                {index < processedStages.length - 1 && (
                  <div className="hidden sm:flex items-center justify-center flex-shrink-0 mx-1">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                 {index < processedStages.length - 1 && (
                  <div className="sm:hidden h-4 flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        {(!overallStart && (!stages || stages.length === 0)) && (
             <p className="text-sm text-muted-foreground text-center pt-2">Defina a data de início do leilão e as praças para ver a linha do tempo.</p>
        )}
      </CardContent>
    </Card>
  );
}
